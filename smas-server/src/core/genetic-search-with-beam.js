const crypto = require('crypto');

// ============================================================
// Drop-in scheduler module
// Keeps controller contract unchanged:
//   const { solveTimetable } = require('../core/beam-search-scheduling.js');
//   const result = await solveTimetable({ getDB, ...options })
// ============================================================

// -----------------------------
// Small utilities
// -----------------------------
function timeToMinutes(t) {
    if (!t) return null;
    const [h, m] = String(t).split(':').map(Number);
    return h * 60 + m;
}

function minutesToTime(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function overlaps(aStart, aEnd, bStart, bEnd) {
    return aStart < bEnd && bStart < aEnd;
}

function stableHash(input) {
    return crypto.createHash('sha1').update(String(input)).digest('hex');
}

function cloneMapSetMap(src) {
    const out = new Map();
    for (const [k, v] of src.entries()) out.set(k, new Set(v));
    return out;
}

function randMulberry32(seed) {
    let a = seed >>> 0;
    return function () {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function shuffleInPlace(arr, rng) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function pickN(arr, n, rng) {
    if (arr.length <= n) return arr.slice();
    const copy = arr.slice();
    shuffleInPlace(copy, rng);
    return copy.slice(0, n);
}

function uniqueBy(arr, keyFn) {
    const seen = new Set();
    const out = [];
    for (const x of arr) {
        const key = keyFn(x);
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(x);
    }
    return out;
}

function median(nums) {
    if (!nums.length) return 0;
    const sorted = nums.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// -----------------------------
// Load config
// -----------------------------
async function getSemesterConfig({ getDB }) {
    const db = getDB();
    const [rows] = await db.execute(
        "SELECT value FROM configurations WHERE `key` = 'SEMESTER_CONFIGURATIONS' LIMIT 1"
    );
    if (!rows.length) throw new Error('Missing SEMESTER_CONFIGURATIONS');
    const config = JSON.parse(rows[0].value);

    return {
        ...config,
        slotDuration: Number(config.slotDuration),
        breakBetween: Number(config.break_between_classes || 0),
        maxCredits: Number(config.maxCredits || 0),
        minCredits: Number(config.minCredits || 0),
        maxClassSize: Number(config.maxClassSize || 0),
        allowConflicts: !!config.allowConflicts,
        dayStart: config.dayStart,
        dayEnd: config.dayEnd,
    };
}

// -----------------------------
// Load data from schema you shared
// -----------------------------
async function loadData({ getDB }) {
    const db = getDB();

    const [courses] = await db.execute('SELECT * FROM courses');
    const [teachers] = await db.execute(`
    SELECT t.user_id, t.priority_time_start, t.priority_time_end, u.name AS teacher_name
    FROM teachers t
    LEFT JOIN users u ON u.id = t.user_id
  `);
    const [teacherDepartments] = await db.execute('SELECT * FROM teacher_departments');
    const [classrooms] = await db.execute('SELECT * FROM classrooms');
    const [days] = await db.execute('SELECT * FROM week_days WHERE is_holiday = 0 ORDER BY id');
    const [availability] = await db.execute('SELECT * FROM teacher_availability');

    const [breaks] = await db.execute('SELECT * FROM breaks');
    const [breakDays] = await db.execute('SELECT * FROM break_days');
    const [breakDepartments] = await db.execute('SELECT * FROM break_departments');

    const [mergeDefs] = await db.execute('SELECT * FROM course_merges');
    const [mergePartners] = await db.execute('SELECT * FROM course_merge_partners');
    const [coursePrerequisites] = await db.execute('SELECT * FROM course_prerequisites');

    const [studentCourseRows] = await db.execute(`
    SELECT student_id, course_id, status
    FROM student_courses
    WHERE status = 'enrolled'
  `);

    const [studentCreditRows] = await db.execute(`
    SELECT sc.student_id, SUM(c.credit_hours) AS total_credits
    FROM student_courses sc
    JOIN courses c ON c.id = sc.course_id
    WHERE sc.status = 'enrolled'
    GROUP BY sc.student_id
  `);

    const teacherMap = new Map();
    teachers.forEach(t => teacherMap.set(Number(t.user_id), t));

    const teacherDepartmentsMap = new Map();
    teacherDepartments.forEach(row => {
        const tid = Number(row.teacher_id);
        const did = Number(row.department_id);
        if (!teacherDepartmentsMap.has(tid)) teacherDepartmentsMap.set(tid, new Set());
        teacherDepartmentsMap.get(tid).add(did);
    });

    const courseStudentsMap = new Map();
    studentCourseRows.forEach(row => {
        const cid = Number(row.course_id);
        const sid = Number(row.student_id);
        if (!courseStudentsMap.has(cid)) courseStudentsMap.set(cid, new Set());
        courseStudentsMap.get(cid).add(sid);
    });

    const studentCreditMap = new Map();
    studentCreditRows.forEach(row => {
        studentCreditMap.set(Number(row.student_id), Number(row.total_credits || 0));
    });

    const breakDayMap = new Map();
    breakDays.forEach(row => {
        const bid = Number(row.break_id);
        const did = Number(row.day_id);
        if (!breakDayMap.has(bid)) breakDayMap.set(bid, new Set());
        breakDayMap.get(bid).add(did);
    });

    const breakDeptMap = new Map();
    breakDepartments.forEach(row => {
        const bid = Number(row.break_id);
        const did = Number(row.department_id);
        if (!breakDeptMap.has(bid)) breakDeptMap.set(bid, new Set());
        breakDeptMap.get(bid).add(did);
    });

    const mergeNameMap = new Map();
    mergeDefs.forEach(m => mergeNameMap.set(Number(m.id), m.merge_name || null));

    const mergePartnerMap = new Map();
    mergePartners.forEach(p => {
        const mid = Number(p.merge_id);
        const cid = Number(p.course_id);
        if (!mergePartnerMap.has(mid)) mergePartnerMap.set(mid, new Set());
        mergePartnerMap.get(mid).add(cid);
    });

    const courseById = new Map();
    courses.forEach(c => courseById.set(Number(c.id), c));

    const prerequisiteRows = coursePrerequisites.map(r => ({
        course_id: Number(r.course_id),
        prerequisite_id: Number(r.prerequisite_id),
    }));

    return {
        courses,
        teachers,
        teacherMap,
        teacherDepartmentsMap,
        classrooms,
        days,
        availability: availability.map(a => ({
            teacher_id: Number(a.teacher_id),
            day_id: Number(a.day_id),
        })),
        breaks: breaks.map(b => ({
            id: Number(b.id),
            label: b.label,
            startMin: timeToMinutes(b.start),
            endMin: timeToMinutes(b.end),
            dayIds: breakDayMap.get(Number(b.id)) || new Set(),
            departmentIds: breakDeptMap.get(Number(b.id)) || new Set(),
        })),
        mergeDefs,
        mergePartnerMap,
        mergeNameMap,
        prerequisiteRows,
        courseById,
        courseStudentsMap,
        studentCreditMap,
    };
}

// -----------------------------
// Preprocess availability
// -----------------------------
function preprocessAvailability(data) {
    const map = new Map();
    for (const a of data.availability) {
        if (!map.has(a.teacher_id)) map.set(a.teacher_id, new Set());
        map.get(a.teacher_id).add(a.day_id);
    }
    data.availabilityMap = map;
}

function teacherIsAvailable(data, teacherId, dayId) {
    return data.availabilityMap?.get(Number(teacherId))?.has(Number(dayId)) || false;
}

function teacherHasDepartment(data, teacherId, deptId) {
    return data.teacherDepartmentsMap?.get(Number(teacherId))?.has(Number(deptId)) || false;
}

function buildTeacherNameMap(data) {
    const map = new Map();
    for (const [tid, teacher] of data.teacherMap.entries()) {
        map.set(Number(tid), teacher.teacher_name || `Teacher ${tid}`);
    }
    return map;
}

// -----------------------------
// Groups / prerequisites
// -----------------------------
function buildGroupPrereqGraph(groups, prerequisiteRows) {
    const courseToGroup = new Map();
    groups.forEach(g => g.courseIds.forEach(cid => courseToGroup.set(cid, g.id)));

    const edges = new Map();
    const indegree = new Map();
    groups.forEach(g => {
        edges.set(g.id, new Set());
        indegree.set(g.id, 0);
    });

    for (const row of prerequisiteRows) {
        const fromGroup = courseToGroup.get(row.prerequisite_id);
        const toGroup = courseToGroup.get(row.course_id);
        if (!fromGroup || !toGroup || fromGroup === toGroup) continue;
        if (!edges.get(fromGroup).has(toGroup)) {
            edges.get(fromGroup).add(toGroup);
            indegree.set(toGroup, indegree.get(toGroup) + 1);
        }
    }

    return { edges, indegree };
}

function topoSortGroups(groups, prerequisiteRows) {
    const { edges, indegree } = buildGroupPrereqGraph(groups, prerequisiteRows);
    const groupMap = new Map(groups.map(g => [g.id, g]));

    const queue = groups
        .filter(g => indegree.get(g.id) === 0)
        .slice()
        .sort((a, b) => (b.demand - a.demand) || (b.creditHours - a.creditHours) || a.id.localeCompare(b.id));

    const ordered = [];
    while (queue.length) {
        const g = queue.shift();
        ordered.push(g);
        for (const to of edges.get(g.id) || []) {
            indegree.set(to, indegree.get(to) - 1);
            if (indegree.get(to) === 0) {
                queue.push(groupMap.get(to));
                queue.sort((a, b) => (b.demand - a.demand) || (b.creditHours - a.creditHours) || a.id.localeCompare(b.id));
            }
        }
    }

    if (ordered.length !== groups.length) {
        const remaining = groups.filter(g => !ordered.some(x => x.id === g.id));
        remaining.sort((a, b) => (b.demand - a.demand) || (b.creditHours - a.creditHours) || a.id.localeCompare(b.id));
        ordered.push(...remaining);
    }

    return ordered;
}

function buildCourseGroups(data) {
    const used = new Set();
    const groups = [];

    for (const course of data.courses) {
        const cid = Number(course.id);
        if (used.has(cid)) continue;

        let mergeId = null;
        for (const [mid, ids] of data.mergePartnerMap.entries()) {
            if (ids.has(cid)) {
                mergeId = mid;
                break;
            }
        }

        if (mergeId != null) {
            const ids = [...data.mergePartnerMap.get(mergeId)];
            const courses = ids.map(id => data.courseById.get(id)).filter(Boolean);
            courses.forEach(c => used.add(Number(c.id)));

            const mergeName = data.mergeNameMap.get(mergeId) || `merge_${mergeId}`;
            const students = new Set();
            const teacherIds = new Set();
            const departmentIds = new Set();
            const courseNames = [];
            const courseCodes = [];
            const creditHoursList = [];

            for (const c of courses) {
                courseNames.push(c.course_name);
                courseCodes.push(c.course_code);
                teacherIds.add(Number(c.teacher_id));
                departmentIds.add(Number(c.department_id));
                creditHoursList.push(Number(c.credit_hours || 0));
                const s = data.courseStudentsMap.get(Number(c.id));
                if (s) for (const sid of s) students.add(Number(sid));
            }

            groups.push({
                id: `merge_${mergeId}`,
                type: 'combined',
                mergeId,
                mergeName,
                courses,
                courseIds: courses.map(c => Number(c.id)),
                courseNames,
                courseCodes,
                teacherIds: [...teacherIds],
                departmentIds: [...departmentIds],
                studentIds: [...students],
                demand: students.size,
                creditHours: Math.max(...creditHoursList),
                courseCreditHours: creditHoursList,
            });
        } else {
            used.add(cid);
            const students = new Set();
            const s = data.courseStudentsMap.get(cid);
            if (s) for (const sid of s) students.add(Number(sid));

            groups.push({
                id: `course_${cid}`,
                type: 'single',
                mergeId: null,
                mergeName: null,
                courses: [course],
                courseIds: [cid],
                courseNames: [course.course_name],
                courseCodes: [course.course_code],
                teacherIds: [Number(course.teacher_id)],
                departmentIds: [Number(course.department_id)],
                studentIds: [...students],
                demand: students.size,
                creditHours: Number(course.credit_hours || 0),
                courseCreditHours: [Number(course.credit_hours || 0)],
            });
        }
    }

    return groups;
}

function expandWorkItems(groups) {
    const items = [];
    for (const g of groups) {
        const sessions = Math.max(1, Number(g.creditHours || 1));
        for (let i = 0; i < sessions; i++) {
            items.push({ group: g, sessionIndex: i, sessionsTotal: sessions });
        }
    }
    return items;
}

// -----------------------------
// Time / slots
// -----------------------------
function generateSlots(config, days) {
    const slots = [];
    const start = timeToMinutes(config.dayStart);
    const end = timeToMinutes(config.dayEnd);
    const slotDuration = Number(config.slotDuration);
    const breakBetween = Number(config.breakBetween || 0);

    for (const day of days) {
        let current = start;
        while (current + slotDuration <= end) {
            slots.push({
                day_id: Number(day.id),
                day_name: day.name,
                startMin: current,
                endMin: current + slotDuration,
                start: minutesToTime(current),
                end: minutesToTime(current + slotDuration),
            });
            current += slotDuration + breakBetween;
        }
    }

    return slots;
}

function preferredPenalty(teacher, slot, options) {
    if (!options.allowTeacherPreference) return 0;
    if (!teacher || !teacher.priority_time_start || !teacher.priority_time_end) return 0;

    const prefStart = timeToMinutes(teacher.priority_time_start);
    const prefEnd = timeToMinutes(teacher.priority_time_end);
    if (slot.startMin >= prefStart && slot.endMin <= prefEnd) return -20;

    const distanceBefore = slot.endMin <= prefStart ? prefStart - slot.endMin : 0;
    const distanceAfter = slot.startMin >= prefEnd ? slot.startMin - prefEnd : 0;
    const distance = Math.max(distanceBefore, distanceAfter);
    return 15 + Math.ceil(distance / 30) * 5;
}

// -----------------------------
// State helpers
// -----------------------------
function initialState() {
    return {
        assignments: [],
        occupiedTeachers: new Map(), // key -> true
        occupiedRooms: new Map(),
        occupiedStudentsBySlot: new Map(), // slotKey -> Set(studentIds)
        groupDayMap: new Map(),
        groupSlotMap: new Map(),
        score: 0,
        hardViolations: 0,
        scheduledCount: 0,
        unscheduled: [],
        tieBreaker: Math.random(),
    };
}

function cloneState(state) {
    return {
        assignments: state.assignments.slice(),
        occupiedTeachers: new Map(state.occupiedTeachers),
        occupiedRooms: new Map(state.occupiedRooms),
        occupiedStudentsBySlot: cloneMapSetMap(state.occupiedStudentsBySlot),
        groupDayMap: cloneMapSetMap(state.groupDayMap),
        groupSlotMap: new Map(state.groupSlotMap),
        score: state.score,
        hardViolations: state.hardViolations,
        scheduledCount: state.scheduledCount,
        unscheduled: state.unscheduled.slice(),
        tieBreaker: state.tieBreaker,
    };
}

function buildStateSignature(state) {
    return state.assignments
        .slice()
        .sort((a, b) => {
            if (a.day_id !== b.day_id) return a.day_id - b.day_id;
            if (a.startMin !== b.startMin) return a.startMin - b.startMin;
            return String(a.group_id).localeCompare(String(b.group_id));
        })
        .map(a => `${a.group_id}:${a.day_id}:${a.start_time}:${a.end_time}:${a.classroom_id}`)
        .join('|');
}

function isValidFinalState(state) {
    return state.unscheduled.length === 0 && state.hardViolations === 0;
}

function sortByStableScore(a, b) {
    if (a.score !== b.score) return a.score - b.score;
    if (a.hardViolations !== b.hardViolations) return a.hardViolations - b.hardViolations;
    if (a.scheduledCount !== b.scheduledCount) return b.scheduledCount - a.scheduledCount;
    return a.tieBreaker - b.tieBreaker;
}

function candidateSortKey(a, b) {
    if (a.score !== b.score) return a.score - b.score;
    if (a.evalResult.violations.length !== b.evalResult.violations.length) {
        return a.evalResult.violations.length - b.evalResult.violations.length;
    }
    if (a.slot.day_id !== b.slot.day_id) return a.slot.day_id - b.slot.day_id;
    if (a.slot.startMin !== b.slot.startMin) return a.slot.startMin - b.slot.startMin;
    return Number(a.room.id) - Number(b.room.id);
}

// -----------------------------
// Evaluation with fast prefilters
// -----------------------------
function evaluatePlacement(state, group, room, slot, data, options) {
    const violations = [];
    let penalty = 0;

    const roomCap = Number(room.capacity || 0);
    const demand = Number(group.demand || 0);
    const slotKey = `${slot.day_id}_${slot.startMin}_${slot.endMin}`;
    const overlapRuleOn = !!options.noOverlaps;
    const capacityRuleOn = !!options.applyRoomConstraint;
    const teacherDeptRuleOn = !!options.enforceTeacherDepartment;
    const prefRuleOn = !!options.allowTeacherPreference;

    // break rules
    for (const br of data.breaks) {
        const deptMatch = !br.departmentIds || br.departmentIds.size === 0 || group.departmentIds.some(d => br.departmentIds.has(Number(d)));
        const dayMatch = !br.dayIds || br.dayIds.size === 0 || br.dayIds.has(Number(slot.day_id));
        if (dayMatch && deptMatch && overlaps(slot.startMin, slot.endMin, br.startMin, br.endMin)) {
            violations.push({ code: 'break_conflict', message: `Slot overlaps break ${br.label || br.id}`, break_id: br.id });
            penalty += 1000000;
        }
    }

    // teacher / student checks
    for (const course of group.courses) {
        const teacherId = Number(course.teacher_id);
        const deptId = Number(course.department_id);

        if (!teacherIsAvailable(data, teacherId, slot.day_id)) {
            violations.push({ code: 'teacher_unavailable', message: `Teacher ${teacherId} unavailable on day ${slot.day_id}`, teacher_id: teacherId });
            penalty += 1000000;
        }

        if (teacherDeptRuleOn && !teacherHasDepartment(data, teacherId, deptId)) {
            violations.push({ code: 'teacher_department_mismatch', message: `Teacher ${teacherId} not mapped to department ${deptId}`, teacher_id: teacherId, department_id: deptId });
            penalty += 25000;
        }

        const tKey = `${teacherId}_${slotKey}`;
        if (state.occupiedTeachers.has(tKey)) {
            violations.push({ code: 'teacher_overlap', message: `Teacher ${teacherId} already occupied at ${slot.start} on day ${slot.day_id}`, teacher_id: teacherId });
            penalty += 200000;
        }

        const slotStudents = state.occupiedStudentsBySlot.get(slotKey);
        if (slotStudents && slotStudents.size) {
            for (const sid of group.studentIds) {
                if (slotStudents.has(Number(sid))) {
                    violations.push({ code: 'student_overlap', message: `Student ${sid} already occupied at ${slot.start} on day ${slot.day_id}`, student_id: sid });
                    penalty += 150000;
                }
            }
        }
    }

    const rKey = `${Number(room.id)}_${slotKey}`;
    if (state.occupiedRooms.has(rKey)) {
        violations.push({ code: 'room_overlap', message: `Room ${room.id} already occupied at ${slot.start} on day ${slot.day_id}`, room_id: Number(room.id) });
        penalty += 200000;
    }

    const gKey = `${group.id}_${slotKey}`;
    if (state.groupSlotMap.has(gKey)) {
        violations.push({ code: 'group_overlap', message: `Group ${group.id} already scheduled at ${slot.start} on day ${slot.day_id}`, group_id: group.id });
        penalty += 200000;
    }

    // capacity
    if (capacityRuleOn && roomCap > 0) {
        if (demand > roomCap) {
            violations.push({ code: 'capacity_insufficient', message: `Room ${room.id} capacity ${roomCap} < class size ${demand}`, room_id: Number(room.id), capacity: roomCap, demand });
            penalty += 120000 + (demand - roomCap) * 1000;
        }
        if (options.maxClassSize && demand > options.maxClassSize) {
            violations.push({ code: 'class_too_large', message: `Class size ${demand} exceeds maxClassSize ${options.maxClassSize}`, demand, maxClassSize: options.maxClassSize });
            penalty += 120000;
        }
    }

    // room optimization
    if (options.optimizeRooms && roomCap > 0) {
        const waste = Math.max(0, roomCap - demand);
        penalty += waste;
        if (waste === 0) penalty -= 10;
    }

    // teacher preference
    if (prefRuleOn) {
        for (const course of group.courses) {
            const teacher = data.teacherMap.get(Number(course.teacher_id));
            penalty += preferredPenalty(teacher, slot, options);
        }
    }

    // spacing between sessions of same group
    const usedDays = state.groupDayMap.get(group.id);
    if (usedDays && usedDays.has(slot.day_id)) penalty += 25;

    const hardRulesEnabled = options.allowConflicts === false;
    const hardViolated = hardRulesEnabled && (
        violations.some(v => ['break_conflict', 'teacher_unavailable'].includes(v.code)) ||
        (overlapRuleOn && violations.some(v => ['teacher_overlap', 'room_overlap', 'student_overlap', 'group_overlap'].includes(v.code))) ||
        (capacityRuleOn && violations.some(v => ['capacity_insufficient', 'class_too_large'].includes(v.code)))
    );
    const aiPenalty = aiScorePlacement(state, group, room, slot, data, options, {
        valid: !hardViolated,
        score: penalty,
        violations,
    });

    penalty += aiPenalty;

    return {
        valid: !hardViolated,
        score: penalty,
        violations,
        slotKey,
        roomKey: rKey,
    };
}

function applyPlacement(state, group, room, slot, evalResult) {
    const next = cloneState(state);
    const slotKey = evalResult.slotKey;

    next.score += evalResult.score;
    next.hardViolations += evalResult.violations.filter(v =>
        ['break_conflict', 'teacher_unavailable', 'teacher_overlap', 'room_overlap', 'student_overlap', 'capacity_insufficient', 'group_overlap'].includes(v.code)
    ).length;
    next.scheduledCount += 1;

    const entry = {
        label: group.type,
        merge_name: group.mergeName || null,
        group_id: group.id,
        course_ids: group.courseIds,
        course_codes: group.courseCodes,
        course_names: group.courseNames,
        teacher_ids: group.teacherIds,
        teacher_names: group.courses.map(c => group._teacherNameMap?.get(Number(c.teacher_id)) || `Teacher ${c.teacher_id}`),
        department_ids: group.departmentIds,
        student_count: group.demand,
        classroom_id: Number(room.id),
        classroom_name: room.name,
        day_id: Number(slot.day_id),
        day_name: slot.day_name,
        start_time: slot.start,
        end_time: slot.end,
        startMin: slot.startMin,
        endMin: slot.endMin,
        violations: evalResult.violations.map(v => v.code),
        penalty: evalResult.score,
    };

    next.assignments.push(entry);

    for (const course of group.courses) {
        const teacherId = Number(course.teacher_id);
        next.occupiedTeachers.set(`${teacherId}_${slotKey}`, true);
    }
    next.occupiedRooms.set(`${Number(room.id)}_${slotKey}`, true);

    let slotStudents = next.occupiedStudentsBySlot.get(slotKey);
    if (!slotStudents) {
        slotStudents = new Set();
        next.occupiedStudentsBySlot.set(slotKey, slotStudents);
    }
    for (const sid of group.studentIds) slotStudents.add(Number(sid));

    next.groupSlotMap.set(`${group.id}_${slotKey}`, true);
    if (!next.groupDayMap.has(group.id)) next.groupDayMap.set(group.id, new Set());
    next.groupDayMap.get(group.id).add(slot.day_id);

    return next;
}

// -----------------------------
// Fast slot candidate generation
// -----------------------------
function buildSlotCache(slots) {
    return slots.map(slot => ({
        ...slot,
        key: `${slot.day_id}_${slot.startMin}_${slot.endMin}`,
    }));
}

function enumerateCandidates(state, group, data, slots, options, rng, roomCaps) {
    const candidates = [];
    const groupTeachers = group.teacherIds;

    for (const slot of slots) {
        // fast teacher availability prefilter
        const unavailableTeacher = groupTeachers.some(tid => !data.availabilityMap?.get(tid)?.has(slot.day_id));
        if (unavailableTeacher) continue;

        const slotKey = slot.key;

        for (let i = 0; i < data.classrooms.length; i++) {
            const room = data.classrooms[i];
            const roomCap = roomCaps[i];

            if (options.applyRoomConstraint && roomCap && group.demand > roomCap) continue;

            const evalResult = evaluatePlacement(state, group, room, slot, data, options);
            if (options.allowConflicts || evalResult.valid) {
                candidates.push({ room, slot, evalResult, score: evalResult.score, slotKey });
            }
        }
    }

    if (!candidates.length) return candidates;

    candidates.sort(candidateSortKey);
    const limit = Math.max(1, Number(options.candidateLimit || 12));
    const top = candidates.slice(0, limit);

    // small diversity among equal-quality candidates
    top.sort((a, b) => {
        const k = candidateSortKey(a, b);
        return k !== 0 ? k : rng() - 0.5;
    });

    return top;
}

// -----------------------------
// Beam search
// -----------------------------
function beamSearch(workItems, data, slots, options, seed = 1) {
    const rng = randMulberry32(seed);
    const roomCaps = data.classrooms.map(r => Number(r.capacity || 0));
    let states = [initialState()];

    for (const item of workItems) {
        const nextStates = [];

        for (const state of states) {
            const candidates = enumerateCandidates(state, item.group, data, slots, options, rng, roomCaps);

            if (!candidates.length) {
                const skipped = cloneState(state);
                skipped.unscheduled.push(item);
                skipped.score += 1000000;
                nextStates.push(skipped);
                continue;
            }

            for (const cand of candidates) {
                const placed = applyPlacement(state, item.group, cand.room, cand.slot, cand.evalResult);

                if (
                    options.stopOnFirstValid &&
                    placed.unscheduled.length === 0 &&
                    placed.hardViolations === 0
                ) {
                    return [placed];
                }

                nextStates.push(placed);
            }
        }

        nextStates.sort(sortByStableScore);

        // diversity-aware beam pruning: keep some elites, some varied states
        const beamWidth = Math.max(1, Number(options.beamWidth || 60));
        const eliteCount = Math.max(1, Math.floor(beamWidth * 0.7));
        const randomCount = Math.max(0, beamWidth - eliteCount);
        const elites = nextStates.slice(0, eliteCount);
        const remainder = nextStates.slice(eliteCount);
        shuffleInPlace(remainder, rng);
        states = uniqueBy([...elites, ...remainder.slice(0, randomCount)], s => buildStateSignature(s)).slice(0, beamWidth);
    }

    states.sort(sortByStableScore);
    return states;
}

// -----------------------------
// AI-like scoring hook
// -----------------------------
function buildPlacementFeatures(state, group, room, slot, data, options, evalResult) {
    const teacherCount = group.teacherIds.length;
    const roomCap = Number(room.capacity || 0);
    const demand = Number(group.demand || 0);
    const waste = Math.max(0, roomCap - demand);
    const teacherPref = group.courses.reduce((sum, c) => {
        const teacher = data.teacherMap.get(Number(c.teacher_id));
        return sum + preferredPenalty(teacher, slot, options);
    }, 0);

    return {
        groupId: group.id,
        groupType: group.type,
        demand,
        roomCap,
        waste,
        teacherCount,
        dayId: slot.day_id,
        startMin: slot.startMin,
        endMin: slot.endMin,
        slotLength: slot.endMin - slot.startMin,
        teacherPreferencePenalty: teacherPref,
        currentScore: state.score,
        hardViolations: state.hardViolations,
        violationCount: evalResult.violations.length,
        teacherUnavailable: evalResult.violations.some(v => v.code === 'teacher_unavailable') ? 1 : 0,
        breakConflict: evalResult.violations.some(v => v.code === 'break_conflict') ? 1 : 0,
        overlapCount: evalResult.violations.filter(v => ['teacher_overlap', 'room_overlap', 'student_overlap', 'group_overlap'].includes(v.code)).length,
    };
}

function defaultAiLikeScorer(features) {
    // Lower is better. This is a strong heuristic fallback.
    let score = 0;
    score += features.breakConflict * 1000000;
    score += features.teacherUnavailable * 1000000;
    score += features.overlapCount * 200000;
    score += features.waste;
    score += features.teacherPreferencePenalty;
    score += features.teacherCount * 8;
    score += features.slotLength <= 0 ? 1000 : 0;
    return score;
}

function aiScorePlacement(state, group, room, slot, data, options, evalResult) {
    const features = buildPlacementFeatures(state, group, room, slot, data, options, evalResult);
    if (typeof options.aiScorer === 'function') {
        const custom = options.aiScorer(features);
        if (Number.isFinite(custom)) return custom;
    }
    return defaultAiLikeScorer(features);
}

// -----------------------------
// Finalization / issues
// -----------------------------
function buildTimetableFromState(state) {
    return state.assignments.slice().sort((a, b) => {
        if (a.day_id !== b.day_id) return a.day_id - b.day_id;
        if (a.startMin !== b.startMin) return a.startMin - b.startMin;
        return String(a.group_id).localeCompare(String(b.group_id));
    });
}

function summarizeCounts(obj, limit = 5) {
    return Object.entries(obj)
        .map(([k, v]) => ({ key: k, count: v }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
}

function explainBlockingForItem(state, item, data, slots, options) {
    const group = item.group;
    const reasonCounts = {};
    const blockedStudents = {};
    const blockedTeachers = {};
    const blockedRooms = {};
    let feasiblePlacements = 0;
    let bestNearMiss = null;

    const roomCaps = data.classrooms.map(r => Number(r.capacity || 0));
    const slotsWithKey = buildSlotCache(slots);

    for (const slot of slotsWithKey) {
        for (let i = 0; i < data.classrooms.length; i++) {
            const room = data.classrooms[i];
            const roomCap = roomCaps[i];
            if (options.applyRoomConstraint && roomCap && group.demand > roomCap) continue;

            const evalResult = evaluatePlacement(state, group, room, slot, data, options);
            if (evalResult.valid) {
                feasiblePlacements += 1;
            } else {
                for (const v of evalResult.violations) {
                    reasonCounts[v.code] = (reasonCounts[v.code] || 0) + 1;
                    if (v.code === 'student_overlap' && v.student_id != null) blockedStudents[v.student_id] = (blockedStudents[v.student_id] || 0) + 1;
                    if (v.code === 'teacher_overlap' && v.teacher_id != null) blockedTeachers[v.teacher_id] = (blockedTeachers[v.teacher_id] || 0) + 1;
                    if (v.code === 'room_overlap' && v.room_id != null) blockedRooms[v.room_id] = (blockedRooms[v.room_id] || 0) + 1;
                }
                if (!bestNearMiss || evalResult.score < bestNearMiss.score) {
                    bestNearMiss = {
                        room_id: Number(room.id),
                        room_name: room.name,
                        day_id: Number(slot.day_id),
                        day_name: slot.day_name,
                        start_time: slot.start,
                        end_time: slot.end,
                        score: evalResult.score,
                        violations: evalResult.violations.map(v => v.code),
                    };
                }
            }
        }
    }

    return {
        group_id: group.id,
        label: group.type,
        merge_name: group.mergeName || null,
        course_ids: group.courseIds,
        course_names: group.courseNames,
        teacher_ids: group.teacherIds,
        department_ids: group.departmentIds,
        student_count: group.demand,
        feasiblePlacements,
        reasons: summarizeCounts(reasonCounts, 8),
        topStudentBlockers: summarizeCounts(blockedStudents, 5),
        topTeacherBlockers: summarizeCounts(blockedTeachers, 5),
        topRoomBlockers: summarizeCounts(blockedRooms, 5),
        bestNearMiss,
    };
}

function buildSolutionIssues(state, data, slots, options) {
    const issues = [];
    for (const item of state.unscheduled) {
        issues.push({
            type: 'unscheduled',
            ...explainBlockingForItem(state, item, data, slots, options),
        });
    }

    const conflictingAssignments = state.assignments.filter(a => a.violations && a.violations.length);
    for (const a of conflictingAssignments) {
        issues.push({
            type: 'conflict',
            group_id: a.group_id,
            label: a.label,
            merge_name: a.merge_name,
            course_ids: a.course_ids,
            course_names: a.course_names,
            teacher_ids: a.teacher_ids,
            department_ids: a.department_ids,
            room_id: a.classroom_id,
            day_id: a.day_id,
            start_time: a.start_time,
            end_time: a.end_time,
            violations: a.violations,
            penalty: a.penalty,
        });
    }

    return issues;
}

function finalizeSolutions(states, data, slots, options, nSolutions) {
    const unique = [];
    const seen = new Set();

    for (const state of states) {
        const timetable = buildTimetableFromState(state);
        const sig = timetable.map(a => `${a.group_id}:${a.day_id}:${a.start_time}:${a.classroom_id}`).join('|');
        if (seen.has(sig)) continue;
        seen.add(sig);

        const complete = state.unscheduled.length === 0;
        const issues = buildSolutionIssues(state, data, slots, options);

        unique.push({
            complete,
            score: state.score,
            hardViolations: state.hardViolations,
            scheduledCount: state.scheduledCount,
            totalWorkItems: state.scheduledCount + state.unscheduled.length,
            unscheduledCount: state.unscheduled.length,
            timetable,
            issues,
        });

        if (unique.length >= nSolutions) break;
    }

    return unique;
}

// -----------------------------
// Genetic algorithm layer
// -----------------------------
function seedGenome(rng, baseOptions = {}) {
    return {
        orderNoise: rng(),
        mutationRate: 0.12 + rng() * 0.12,
        beamWidth: Math.max(20, Math.round((baseOptions.beamWidth || 60) * (0.6 + rng() * 0.5))),
        candidateLimit: Math.max(6, Math.round((baseOptions.candidateLimit || 12) * (0.7 + rng() * 0.6))),
        preferenceWeight: 0.8 + rng() * 1.2,
        roomWasteWeight: 0.7 + rng() * 1.0,
        sameDayWeight: 0.8 + rng() * 1.2,
        teacherPrefWeight: 0.8 + rng() * 1.2,
    };
}

function crossoverGenome(a, b, rng) {
    const pick = (x, y) => (rng() < 0.5 ? x : y);
    return {
        orderNoise: pick(a.orderNoise, b.orderNoise),
        mutationRate: Math.min(0.5, Math.max(0.03, (a.mutationRate + b.mutationRate) / 2 + (rng() - 0.5) * 0.04)),
        beamWidth: Math.max(10, Math.round((a.beamWidth + b.beamWidth) / 2)),
        candidateLimit: Math.max(4, Math.round((a.candidateLimit + b.candidateLimit) / 2)),
        preferenceWeight: (a.preferenceWeight + b.preferenceWeight) / 2,
        roomWasteWeight: (a.roomWasteWeight + b.roomWasteWeight) / 2,
        sameDayWeight: (a.sameDayWeight + b.sameDayWeight) / 2,
        teacherPrefWeight: (a.teacherPrefWeight + b.teacherPrefWeight) / 2,
    };
}

function mutateGenome(g, rng) {
    const m = { ...g };
    const jitter = (v, scale) => v + (rng() - 0.5) * scale;

    if (rng() < 0.5) m.orderNoise = rng();
    if (rng() < 0.5) m.mutationRate = Math.max(0.03, Math.min(0.5, jitter(m.mutationRate, 0.06)));
    if (rng() < 0.4) m.beamWidth = Math.max(10, Math.round(jitter(m.beamWidth, 14)));
    if (rng() < 0.4) m.candidateLimit = Math.max(4, Math.round(jitter(m.candidateLimit, 6)));
    if (rng() < 0.4) m.preferenceWeight = Math.max(0.2, jitter(m.preferenceWeight, 0.35));
    if (rng() < 0.4) m.roomWasteWeight = Math.max(0.2, jitter(m.roomWasteWeight, 0.35));
    if (rng() < 0.4) m.sameDayWeight = Math.max(0.2, jitter(m.sameDayWeight, 0.35));
    if (rng() < 0.4) m.teacherPrefWeight = Math.max(0.2, jitter(m.teacherPrefWeight, 0.35));
    return m;
}

function genomeToOptions(genome, baseOptions) {
    return {
        ...baseOptions,
        beamWidth: genome.beamWidth,
        candidateLimit: genome.candidateLimit,
        genome,
    };
}

function orderGroupsWithGenome(groups, data, slots, options, genome, rng) {
    preprocessAvailability(data);
    const teacherNameMap = buildTeacherNameMap(data);
    groups.forEach(g => {
        g._teacherNameMap = teacherNameMap;
        g.difficulty = estimateGroupDifficulty(g, data, slots, options);
    });

    const topoOrdered = topoSortGroups(groups, data.prerequisiteRows);
    const index = new Map();
    topoOrdered.forEach((g, i) => index.set(g.id, i));

    const ordered = topoOrdered.slice().sort((a, b) => {
        const ia = index.get(a.id), ib = index.get(b.id);
        if (ia !== ib) return ia - ib;
        if (a.difficulty !== b.difficulty) return a.difficulty - b.difficulty;
        if (b.demand !== a.demand) return b.demand - a.demand;
        return a.id.localeCompare(b.id);
    });

    // small genome-based perturbation within close difficulty bands
    const noisy = ordered.map(g => ({ g, noise: rng() * genome.orderNoise }));
    noisy.sort((x, y) => {
        const dx = x.g.difficulty + x.noise;
        const dy = y.g.difficulty + y.noise;
        if (dx !== dy) return dx - dy;
        return x.g.id.localeCompare(y.g.id);
    });
    return noisy.map(x => x.g);
}

function buildWorkItemsForGenome(groups) {
    const items = [];
    for (const g of groups) {
        const sessions = Math.max(1, Number(g.creditHours || 1));
        for (let i = 0; i < sessions; i++) items.push({ group: g, sessionIndex: i, sessionsTotal: sessions });
    }
    return items;
}

function scoreFinalResult(solution) {
    // Lower is better.
    let score = 0;
    score += solution.hardViolations * 1000000;
    score += solution.unscheduledCount * 1000000;
    score += solution.score;
    score -= solution.scheduledCount * 1000;
    return score;
}

function tournamentSelect(pop, rng, k = 3) {
    let best = null;
    for (let i = 0; i < k; i++) {
        const cand = pop[Math.floor(rng() * pop.length)];
        if (!best || cand.fitness < best.fitness) best = cand;
    }
    return best;
}

function diversitySignature(solution) {
    return solution.timetable
        .map(a => `${a.group_id}:${a.day_id}:${a.start_time}:${a.end_time}:${a.classroom_id}`)
        .join('|');
}

function solveWithGenome({ genome, baseOptions, baseData, slots, groups, rng }) {
    const options = genomeToOptions(genome, baseOptions);
    const orderedGroups = orderGroupsWithGenome(groups.slice(), baseData, slots, options, genome, rng);
    const workItems = buildWorkItemsForGenome(orderedGroups);
    const states = beamSearch(workItems, baseData, slots, options, Math.floor(rng() * 1e9));
    const pool = states.slice().sort(sortByStableScore);
    const solutions = finalizeSolutions(pool, baseData, slots, options, baseOptions.nSolutions || 5);
    const best = solutions[0] || null;
    const fitness = best ? scoreFinalResult(best) : Number.MAX_SAFE_INTEGER;
    return { best, solutions, fitness, genome };
}

async function runHybridGeneticBeamScheduler({ getDB, ...userOptions }) {
    const config = await getSemesterConfig({ getDB });
    const rawData = await loadData({ getDB });
    const options = {
        nSolutions: 5,
        beamWidth: 60,
        restarts: 8,
        candidateLimit: 12,
        stopOnFirstValid: false,
        requireValidSolutions: true,
        allowConflicts: false,
        noOverlaps: true,
        applyRoomConstraint: true,
        optimizeRooms: true,
        allowTeacherPreference: true,
        enforceTeacherDepartment: false,
        usePrerequisiteOrdering: true,
        debug: false,
        gaPopulation: 8,
        gaGenerations: 6,
        ...userOptions,
        allowConflicts: userOptions.allowConflicts ?? config.allowConflicts ?? false,
    };

    const data = { ...rawData };
    preprocessAvailability(data);

    const preflightIssues = preflightChecks(data, config, options);
    const slots = buildSlotCache(generateSlots(config, data.days));
    const groups = buildCourseGroups(data);
    const rng = randMulberry32(1234567);

    // GA population
    let population = Array.from({ length: Math.max(2, options.gaPopulation) }, () => seedGenome(rng, options));
    let bestOverall = null;
    const archive = [];

    for (let gen = 0; gen < Math.max(1, options.gaGenerations); gen++) {
        const scored = [];

        for (const genome of population) {
            const run = solveWithGenome({ genome, baseOptions: options, baseData: data, slots, groups, rng });
            scored.push({ genome, fitness: run.fitness, best: run.best, solutions: run.solutions });
            if (run.solutions && run.solutions.length) {
                archive.push(...run.solutions);
            }
            if (!bestOverall || run.fitness < bestOverall.fitness) bestOverall = { fitness: run.fitness, best: run.best, genome };
        }

        scored.sort((a, b) => a.fitness - b.fitness);
        const eliteCount = Math.max(1, Math.ceil(scored.length * 0.25));
        const elites = scored.slice(0, eliteCount);
        const nextPopulation = elites.map(x => x.genome);

        while (nextPopulation.length < population.length) {
            const p1 = tournamentSelect(scored, rng);
            const p2 = tournamentSelect(scored, rng);
            let child = crossoverGenome(p1.genome, p2.genome, rng);
            if (rng() < 0.9) child = mutateGenome(child, rng);
            nextPopulation.push(child);
        }

        population = nextPopulation;
    }

    const allSolutions = archive
        .filter(Boolean)
        .map(s => ({ ...s, __sig: diversitySignature(s) }));

    const uniqueMap = new Map();
    for (const s of allSolutions) {
        if (!uniqueMap.has(s.__sig)) uniqueMap.set(s.__sig, s);
    }

    const pool = Array.from(uniqueMap.values())
        .sort((a, b) => scoreFinalResult(a) - scoreFinalResult(b));

    let finalSolutions = pool.slice(0, Math.max(1, options.nSolutions || 5));
    if (options.requireValidSolutions) {
        finalSolutions = finalSolutions.filter(s => s.complete && s.hardViolations === 0);
    }

    return {
        config,
        options,
        preflightIssues,
        slotsGenerated: slots.length,
        totalWorkItems: expandWorkItems(groups).length,
        validSolutionCount: finalSolutions.filter(s => s.complete && s.hardViolations === 0).length,
        solutions: finalSolutions,
        bestGenome: bestOverall?.genome || null,
    };
}

function estimateGroupDifficulty(group, data, slots, options) {
    let feasibleScore = 0;
    const teacherIds = group.teacherIds || [];

    for (const slot of slots) {
        let teacherOk = true;

        for (const course of group.courses) {
            if (!teacherIsAvailable(data, Number(course.teacher_id), slot.day_id)) {
                teacherOk = false;
                break;
            }
        }

        if (!teacherOk) continue;

        let roomOk = 0;
        for (const room of data.classrooms) {
            const cap = Number(room.capacity || 0);
            if (!options.applyRoomConstraint || !cap || group.demand <= cap) {
                roomOk += 1;
            }
        }

        feasibleScore += roomOk;
    }

    // Lower = harder group
    return (1 / (feasibleScore + 1)) * 1000 + teacherIds.length * 25 + group.creditHours * 10 + group.demand * 0.5;
}

function preflightChecks(data, config, options) {
    const issues = [];

    const maxRoomCapacity = Math.max(...data.classrooms.map(r => Number(r.capacity || 0)), 0);

    for (const course of data.courses) {
        const cid = Number(course.id);
        const demand = data.courseStudentsMap.get(cid)?.size || 0;
        const teacherId = Number(course.teacher_id);
        const deptId = Number(course.department_id);

        if (config.maxClassSize && demand > config.maxClassSize) {
            issues.push({
                type: "preflight",
                code: "class_too_large",
                course_id: cid,
                course_name: course.course_name,
                course_code: course.course_code,
                student_count: demand,
                maxClassSize: config.maxClassSize,
            });
        }

        if (options.applyRoomConstraint && demand > maxRoomCapacity) {
            issues.push({
                type: "preflight",
                code: "no_room_big_enough",
                course_id: cid,
                course_name: course.course_name,
                course_code: course.course_code,
                student_count: demand,
                maxRoomCapacity,
            });
        }

        let anyAvailability = false;
        for (const day of data.days) {
            if (teacherIsAvailable(data, teacherId, Number(day.id))) {
                anyAvailability = true;
                break;
            }
        }

        if (!anyAvailability) {
            issues.push({
                type: "preflight",
                code: "teacher_no_availability_found",
                course_id: cid,
                course_name: course.course_name,
                course_code: course.course_code,
                teacher_id: teacherId,
            });
        }

        if (options.enforceTeacherDepartment && !teacherHasDepartment(data, teacherId, deptId)) {
            issues.push({
                type: "preflight",
                code: "teacher_department_mismatch",
                course_id: cid,
                course_name: course.course_name,
                course_code: course.course_code,
                teacher_id: teacherId,
                department_id: deptId,
            });
        }
    }

    for (const [studentId, totalCredits] of data.studentCreditMap.entries()) {
        if (config.maxCredits && totalCredits > config.maxCredits) {
            issues.push({
                type: "preflight",
                code: "student_over_max_credits",
                student_id: studentId,
                total_credits: totalCredits,
                maxCredits: config.maxCredits,
            });
        }

        if (config.minCredits && totalCredits < config.minCredits) {
            issues.push({
                type: "preflight",
                code: "student_below_min_credits",
                student_id: studentId,
                total_credits: totalCredits,
                minCredits: config.minCredits,
            });
        }
    }

    const groups = buildCourseGroups(data);
    for (const g of groups) {
        if (g.type === "combined") {
            const uniqCredits = [...new Set(g.courseCreditHours)];
            if (uniqCredits.length > 1) {
                issues.push({
                    type: "preflight",
                    code: "merge_credit_mismatch",
                    group_id: g.id,
                    merge_name: g.mergeName,
                    course_ids: g.courseIds,
                    course_names: g.courseNames,
                    credit_hours: g.courseCreditHours,
                });
            }
        }
    }

    return issues;
}

// -----------------------------
// Compatibility export
// -----------------------------
async function solveTimetable(userOptions = {}) {
    // Backward-compatible entry point.
    // This now runs the GA + beam hybrid and returns the same shape your controller expects.
    return runHybridGeneticBeamScheduler(userOptions);
}

module.exports = {
    // main entry
    solveTimetable,
    runHybridGeneticBeamScheduler,

    // config/data helpers
    getSemesterConfig,
    loadData,
    preprocessAvailability,
    teacherIsAvailable,
    teacherHasDepartment,
    buildTeacherNameMap,

    // groups / slots
    buildGroupPrereqGraph,
    topoSortGroups,
    buildCourseGroups,
    expandWorkItems,
    generateSlots,
    buildSlotCache,

    // search / scoring
    evaluatePlacement,
    preferredPenalty,
    candidateSortKey,
    sortByStableScore,
    initialState,
    cloneState,
    applyPlacement,
    enumerateCandidates,
    beamSearch,
    aiScorePlacement,
    buildPlacementFeatures,
    defaultAiLikeScorer,

    // solution output
    buildTimetableFromState,
    finalizeSolutions,
    buildSolutionIssues,
    explainBlockingForItem,

    // GA helpers
    seedGenome,
    crossoverGenome,
    mutateGenome,
    solveWithGenome,
    scoreFinalResult,
};
