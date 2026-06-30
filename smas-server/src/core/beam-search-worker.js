"use strict";

const { parentPort, workerData } = require("worker_threads");
const {
    beamSearch,
    isValidFinalState,
    buildStateSignature,
} = require("./beam-search-scheduling");

(async () => {
    try {
        const { workItems, data, slots, options, seeds } = workerData;

        const candidateStates = [];
        const validSolutions = [];
        const seen = new Set();

        for (const seed of seeds) {
            const states = beamSearch(workItems, data, slots, options, seed);
            candidateStates.push(...states);

            for (const s of states) {
                if (!isValidFinalState(s)) continue;

                const sig = buildStateSignature(s);
                if (seen.has(sig)) continue;

                seen.add(sig);
                validSolutions.push(s);
            }
        }

        parentPort.postMessage({
            candidateStates,
            validSolutions,
        });
    } catch (err) {
        parentPort.postMessage({
            error: err?.message || String(err),
            stack: err?.stack || null,
        });
    }
})();