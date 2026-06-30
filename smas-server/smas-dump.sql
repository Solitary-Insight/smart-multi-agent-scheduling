/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-11.8.2-MariaDB, for Linux (x86_64)
--
-- Host: localhost    Database: SMAS
-- ------------------------------------------------------
-- Server version	11.8.2-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `break_days`
--

DROP TABLE IF EXISTS `break_days`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `break_days` (
  `break_id` int(11) NOT NULL,
  `day_id` int(11) NOT NULL,
  PRIMARY KEY (`break_id`,`day_id`),
  KEY `day_id` (`day_id`),
  CONSTRAINT `break_days_ibfk_1` FOREIGN KEY (`break_id`) REFERENCES `breaks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `break_days_ibfk_2` FOREIGN KEY (`day_id`) REFERENCES `week_days` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `break_days`
--

LOCK TABLES `break_days` WRITE;
/*!40000 ALTER TABLE `break_days` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `break_days` VALUES
(2,1),
(4,1),
(2,2),
(4,2),
(2,3),
(4,3),
(2,4),
(4,4),
(2,5),
(4,5);
/*!40000 ALTER TABLE `break_days` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `break_departments`
--

DROP TABLE IF EXISTS `break_departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `break_departments` (
  `break_id` int(11) NOT NULL,
  `department_id` int(11) NOT NULL,
  PRIMARY KEY (`break_id`,`department_id`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `break_departments_ibfk_1` FOREIGN KEY (`break_id`) REFERENCES `breaks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `break_departments_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `break_departments`
--

LOCK TABLES `break_departments` WRITE;
/*!40000 ALTER TABLE `break_departments` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `break_departments` VALUES
(2,1),
(4,1),
(2,2),
(4,2),
(2,3),
(4,3),
(2,4),
(4,4);
/*!40000 ALTER TABLE `break_departments` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `breaks`
--

DROP TABLE IF EXISTS `breaks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `breaks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `label` varchar(100) NOT NULL,
  `start` time NOT NULL,
  `end` time NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `breaks`
--

LOCK TABLES `breaks` WRITE;
/*!40000 ALTER TABLE `breaks` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `breaks` VALUES
(2,'Lunch Break','13:00:00','14:00:00','2026-03-29 16:11:38'),
(4,'Afternoon Break','15:00:00','15:20:00','2026-04-02 12:46:42');
/*!40000 ALTER TABLE `breaks` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `classrooms`
--

DROP TABLE IF EXISTS `classrooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `classrooms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `building` varchar(100) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `capacity` int(11) DEFAULT NULL,
  `equipments` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `classrooms`
--

LOCK TABLES `classrooms` WRITE;
/*!40000 ALTER TABLE `classrooms` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `classrooms` VALUES
(1,'Lecture Hall A','Main Campus','lecture',120,'Projector,Whiteboard,Sound System,Air Conditioning','2026-03-29 16:11:38','2026-03-29 16:11:38'),
(2,'Lecture Hall B','Main Campus','lecture',80,'Projector,Whiteboard,Air Conditioning','2026-03-29 16:11:38','2026-03-29 16:11:38'),
(3,'CS Lab 1','Computer Science Block','lab',30,'Computers,Projector,Network Switch','2026-03-29 16:11:38','2026-03-29 16:11:38'),
(4,'CS Lab 2','Computer Science Block','lab',24,'Computers,Projector,3D Printer','2026-03-29 16:11:38','2026-03-29 16:11:38'),
(5,'Physics Lab','Science Block','lab',24,'Oscilloscope,Power Supply,Work Benches,Projector','2026-03-29 16:11:38','2026-03-29 16:11:38'),
(6,'Seminar Room 201','Academic Block','seminar',35,'Board,Projector,Speakers,Moveable Desks','2026-03-29 16:11:38','2026-03-29 16:11:38'),
(7,'CS 3','Main Building','lecture',50,'Project,Lights,Board','2026-04-02 13:00:01','2026-04-02 13:00:01');
/*!40000 ALTER TABLE `classrooms` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `configurations`
--

DROP TABLE IF EXISTS `configurations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `configurations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `key` varchar(100) NOT NULL,
  `value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`value`)),
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `configurations`
--

LOCK TABLES `configurations` WRITE;
/*!40000 ALTER TABLE `configurations` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `configurations` VALUES
(1,'SEMESTER_CONFIGURATIONS','{\"semesterName\":\"Spring 2026\",\"startDate\":\"2026-02-16\",\"endDate\":\"2026-06-06\",\"maxCredits\":18,\"minCredits\":0,\"slotDuration\":50,\"break_between_classes\":15,\"dayStart\":\"08:00\",\"dayEnd\":\"18:00\",\"allowConflicts\":false,\"autoNotify\":true,\"requireApproval\":true,\"maxClassSize\":35,\"enrollmentOpen\":true,\"weekStart\":1}','Configurations for semester','2026-03-29 16:11:38','2026-04-13 11:30:07');
/*!40000 ALTER TABLE `configurations` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `course_merge_partners`
--

DROP TABLE IF EXISTS `course_merge_partners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_merge_partners` (
  `merge_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  PRIMARY KEY (`merge_id`,`course_id`),
  KEY `course_id` (`course_id`),
  CONSTRAINT `course_merge_partners_ibfk_1` FOREIGN KEY (`merge_id`) REFERENCES `course_merges` (`id`) ON DELETE CASCADE,
  CONSTRAINT `course_merge_partners_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `course_merge_partners`
--

LOCK TABLES `course_merge_partners` WRITE;
/*!40000 ALTER TABLE `course_merge_partners` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `course_merge_partners` VALUES
(2,1),
(2,3),
(1,8),
(1,9);
/*!40000 ALTER TABLE `course_merge_partners` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `course_merges`
--

DROP TABLE IF EXISTS `course_merges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_merges` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `merge_name` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `course_merges`
--

LOCK TABLES `course_merges` WRITE;
/*!40000 ALTER TABLE `course_merges` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `course_merges` VALUES
(1,'Combined Class Math'),
(2,'Class For DSA & PF');
/*!40000 ALTER TABLE `course_merges` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `course_prerequisites`
--

DROP TABLE IF EXISTS `course_prerequisites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_prerequisites` (
  `course_id` int(11) NOT NULL,
  `prerequisite_id` int(11) NOT NULL,
  PRIMARY KEY (`course_id`,`prerequisite_id`),
  KEY `fk_prerequisite` (`prerequisite_id`),
  CONSTRAINT `fk_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_prerequisite` FOREIGN KEY (`prerequisite_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `course_prerequisites`
--

LOCK TABLES `course_prerequisites` WRITE;
/*!40000 ALTER TABLE `course_prerequisites` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `course_prerequisites` VALUES
(2,1),
(3,2),
(7,2),
(4,3),
(5,3),
(6,4),
(9,8),
(11,8),
(10,9),
(12,10),
(14,13),
(15,14),
(16,14),
(18,17),
(19,18),
(20,18);
/*!40000 ALTER TABLE `course_prerequisites` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `courses`
--

DROP TABLE IF EXISTS `courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `course_name` varchar(150) NOT NULL,
  `course_code` varchar(50) NOT NULL,
  `department_id` int(11) NOT NULL,
  `teacher_id` int(11) NOT NULL,
  `semester` int(11) NOT NULL,
  `credit_hours` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `course_code` (`course_code`),
  KEY `fk_course_department` (`department_id`),
  KEY `fk_course_teacher` (`teacher_id`),
  CONSTRAINT `fk_course_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_course_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses`
--

LOCK TABLES `courses` WRITE;
/*!40000 ALTER TABLE `courses` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `courses` VALUES
(1,'Intro to Programming','CS101',1,2,1,3,'Foundational programming using Python and problem solving.'),
(2,'Object-Oriented Programming','CS102',1,6,2,3,'Classes, objects, inheritance, and modular design.'),
(3,'Data Structures','CS201',1,2,3,3,'Lists, stacks, queues, trees, and hash tables.'),
(4,'Database Systems','CS202',1,6,4,3,'Relational modeling, SQL, normalization, and transactions.'),
(5,'Operating Systems','CS301',1,2,5,3,'Processes, threads, memory management, and scheduling.'),
(6,'Software Engineering','CS302',1,6,6,3,'Requirements, design, testing, and project delivery.'),
(7,'Web Development','CS303',1,6,5,3,'Client-server web applications and modern frameworks.'),
(8,'Calculus I','MATH101',2,7,1,4,'Limits, derivatives, and introductory applications.'),
(9,'Calculus II','MATH102',2,7,2,4,'Integration techniques and applications of calculus.'),
(10,'Linear Algebra','MATH201',2,3,3,3,'Vectors, matrices, eigenvalues, and systems of equations.'),
(11,'Discrete Mathematics','MATH202',2,7,2,3,'Logic, proofs, combinatorics, and graph theory.'),
(12,'Probability and Statistics','MATH301',2,3,5,3,'Random variables, distributions, and inference.'),
(13,'Physics I','PHYS101',3,4,1,4,'Mechanics, motion, forces, and energy.'),
(14,'Physics II','PHYS102',3,8,2,4,'Electricity, magnetism, and wave phenomena.'),
(15,'Modern Physics','PHYS201',3,4,3,3,'Relativity, quantum ideas, and atomic models.'),
(16,'Electronics for Scientists','PHYS202',3,8,4,3,'Circuits, sensors, and instrumentation.'),
(17,'Circuit Analysis','EE101',4,5,1,4,'Ohm\'s law, network theorems, and DC/AC basics.'),
(18,'Digital Logic Design','EE102',4,9,2,3,'Boolean algebra, combinational, and sequential logic.'),
(19,'Microprocessors','EE201',4,5,3,3,'Architecture, assembly language, and interfacing.'),
(20,'Control Systems','EE202',4,9,5,3,'Feedback, stability, and controller basics.'),
(23,'English Composition & Communication','CS304',1,125,2,3,''),
(24,'Descret Structure','CS310',1,126,2,1,''),
(26,'Numerical Computing','CS-230',1,5,3,3,'');
/*!40000 ALTER TABLE `courses` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `head_of_department` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `code` varchar(10) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `fk_hod` (`head_of_department`),
  CONSTRAINT `departments_ibfk_1` FOREIGN KEY (`head_of_department`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_hod` FOREIGN KEY (`head_of_department`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `departments` VALUES
(1,'Computer Science',2,'2026-03-29 16:11:38','CS'),
(2,'Mathematics',3,'2026-03-29 16:11:38','MATH'),
(3,'Physics',4,'2026-03-29 16:11:38','PHYS'),
(4,'Electrical Engineering',5,'2026-03-29 16:11:38','EE');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `message_recipients`
--

DROP TABLE IF EXISTS `message_recipients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `message_recipients` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `message_id` bigint(20) NOT NULL,
  `user_id` bigint(20) DEFAULT NULL,
  `role` enum('admin','teacher','student') DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `read_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `message_id` (`message_id`),
  KEY `idx_user_messages` (`user_id`,`is_read`),
  KEY `idx_role_messages` (`role`,`is_read`),
  CONSTRAINT `message_recipients_ibfk_1` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=149 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `message_recipients`
--

LOCK TABLES `message_recipients` WRITE;
/*!40000 ALTER TABLE `message_recipients` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `message_recipients` VALUES
(1,1,122,NULL,1,'2026-04-20 16:50:34'),
(2,2,122,NULL,1,'2026-04-20 16:50:34'),
(3,3,122,NULL,1,'2026-04-20 16:50:34'),
(4,4,122,NULL,1,'2026-04-20 16:50:34'),
(5,5,122,NULL,1,'2026-04-20 16:50:34'),
(6,6,110,NULL,1,'2026-04-20 16:37:40'),
(7,7,110,NULL,1,'2026-04-20 16:37:40'),
(8,8,110,NULL,1,'2026-04-20 16:37:40'),
(9,8,1,NULL,1,'2026-04-09 17:00:12'),
(10,8,104,NULL,0,NULL),
(11,8,114,NULL,0,NULL),
(12,8,8,NULL,0,NULL),
(13,8,126,NULL,0,NULL),
(14,8,111,NULL,0,NULL),
(15,8,2,NULL,1,'2026-04-13 17:06:37'),
(16,8,3,NULL,0,NULL),
(17,8,122,NULL,1,'2026-04-20 16:50:34'),
(18,8,106,NULL,0,NULL),
(19,8,109,NULL,0,NULL),
(20,8,118,NULL,0,NULL),
(21,8,108,NULL,0,NULL),
(22,8,5,NULL,0,NULL),
(23,8,119,NULL,0,NULL),
(24,8,103,NULL,0,NULL),
(25,8,124,NULL,0,NULL),
(26,8,123,NULL,0,NULL),
(27,8,117,NULL,0,NULL),
(28,8,101,NULL,0,NULL),
(29,8,113,NULL,0,NULL),
(30,8,116,NULL,0,NULL),
(31,8,6,NULL,0,NULL),
(32,8,105,NULL,0,NULL),
(33,8,7,NULL,0,NULL),
(34,8,121,NULL,0,NULL),
(35,8,112,NULL,0,NULL),
(36,8,107,NULL,0,NULL),
(37,8,4,NULL,0,NULL),
(38,8,120,NULL,0,NULL),
(39,8,102,NULL,0,NULL),
(40,8,9,NULL,0,NULL),
(41,8,125,NULL,0,NULL),
(42,8,115,NULL,0,NULL),
(43,9,2,NULL,1,'2026-04-13 17:06:37'),
(44,10,2,NULL,1,'2026-04-13 17:06:37'),
(45,11,2,NULL,1,'2026-04-13 17:06:37'),
(46,12,2,NULL,1,'2026-04-13 17:06:37'),
(47,13,2,NULL,1,'2026-04-13 17:06:37'),
(48,14,101,NULL,0,NULL),
(49,14,103,NULL,0,NULL),
(50,14,104,NULL,0,NULL),
(51,14,105,NULL,0,NULL),
(52,14,111,NULL,0,NULL),
(53,14,113,NULL,0,NULL),
(54,14,115,NULL,0,NULL),
(55,14,119,NULL,0,NULL),
(56,14,122,NULL,1,'2026-04-20 16:50:34'),
(57,14,2,NULL,1,'2026-04-13 17:06:37'),
(58,15,2,NULL,1,'2026-04-13 17:06:37'),
(59,16,101,NULL,0,NULL),
(60,16,103,NULL,0,NULL),
(61,16,104,NULL,0,NULL),
(62,16,105,NULL,0,NULL),
(63,16,111,NULL,0,NULL),
(64,16,113,NULL,0,NULL),
(65,16,115,NULL,0,NULL),
(66,16,119,NULL,0,NULL),
(67,16,122,NULL,1,'2026-04-20 16:50:34'),
(68,16,2,NULL,1,'2026-04-13 17:06:37'),
(69,17,110,NULL,0,NULL),
(70,17,1,NULL,1,'2026-04-09 17:00:12'),
(71,17,104,NULL,0,NULL),
(72,17,114,NULL,0,NULL),
(73,17,8,NULL,0,NULL),
(74,17,126,NULL,0,NULL),
(75,17,111,NULL,0,NULL),
(76,17,2,NULL,1,'2026-04-13 17:06:37'),
(77,17,3,NULL,0,NULL),
(78,17,122,NULL,0,NULL),
(79,17,106,NULL,0,NULL),
(80,17,109,NULL,0,NULL),
(81,17,118,NULL,0,NULL),
(82,17,108,NULL,0,NULL),
(83,17,5,NULL,0,NULL),
(84,17,119,NULL,0,NULL),
(85,17,103,NULL,0,NULL),
(86,17,124,NULL,0,NULL),
(87,17,123,NULL,0,NULL),
(88,17,117,NULL,0,NULL),
(89,17,101,NULL,0,NULL),
(90,17,113,NULL,0,NULL),
(91,17,116,NULL,0,NULL),
(92,17,6,NULL,0,NULL),
(93,17,105,NULL,0,NULL),
(94,17,7,NULL,0,NULL),
(95,17,121,NULL,0,NULL),
(96,17,112,NULL,0,NULL),
(97,17,107,NULL,0,NULL),
(98,17,4,NULL,0,NULL),
(99,17,120,NULL,0,NULL),
(100,17,102,NULL,0,NULL),
(101,17,9,NULL,0,NULL),
(102,17,125,NULL,0,NULL),
(103,17,115,NULL,0,NULL),
(104,18,110,NULL,0,NULL),
(105,18,1,NULL,1,'2026-04-09 17:00:12'),
(106,18,104,NULL,0,NULL),
(107,18,114,NULL,0,NULL),
(108,18,8,NULL,0,NULL),
(109,18,126,NULL,0,NULL),
(110,18,111,NULL,0,NULL),
(111,18,2,NULL,1,'2026-04-13 17:06:37'),
(112,18,3,NULL,0,NULL),
(113,18,122,NULL,0,NULL),
(114,18,106,NULL,0,NULL),
(115,18,109,NULL,0,NULL),
(116,18,118,NULL,0,NULL),
(117,18,108,NULL,0,NULL),
(118,18,5,NULL,0,NULL),
(119,18,119,NULL,0,NULL),
(120,18,103,NULL,0,NULL),
(121,18,124,NULL,0,NULL),
(122,18,123,NULL,0,NULL),
(123,18,117,NULL,0,NULL),
(124,18,101,NULL,0,NULL),
(125,18,113,NULL,0,NULL),
(126,18,116,NULL,0,NULL),
(127,18,6,NULL,0,NULL),
(128,18,105,NULL,0,NULL),
(129,18,7,NULL,0,NULL),
(130,18,121,NULL,0,NULL),
(131,18,112,NULL,0,NULL),
(132,18,107,NULL,0,NULL),
(133,18,4,NULL,0,NULL),
(134,18,120,NULL,0,NULL),
(135,18,102,NULL,0,NULL),
(136,18,9,NULL,0,NULL),
(137,18,125,NULL,0,NULL),
(138,18,115,NULL,0,NULL),
(139,19,101,NULL,0,NULL),
(140,19,103,NULL,0,NULL),
(141,19,104,NULL,0,NULL),
(142,19,105,NULL,0,NULL),
(143,19,111,NULL,0,NULL),
(144,19,113,NULL,0,NULL),
(145,19,115,NULL,0,NULL),
(146,19,119,NULL,0,NULL),
(147,19,122,NULL,0,NULL),
(148,19,2,NULL,1,'2026-04-13 17:06:37');
/*!40000 ALTER TABLE `message_recipients` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `messages` VALUES
(1,'Course Enrollment Request','Your request to enroll in course 17 has been submitted and is pending approval.','2026-04-20 14:32:41'),
(2,'Course Enrollment Request','Your request to enroll in course 17 has been submitted and is pending approval.','2026-04-20 14:46:44'),
(3,'Course Enrollment Request','Your request to enroll in course 17 has been submitted and is pending approval.','2026-04-20 14:51:37'),
(4,'Course Enrollment Request','Your request to enroll in course 17 has been submitted and is pending approval.','2026-04-20 14:53:10'),
(5,'Course Enrollment Request','Your request to enroll in course 17 has been submitted and is pending approval.','2026-04-20 15:01:18'),
(6,'Course Withdrawn','You have successfully withdrawn from course 11.','2026-04-20 15:12:09'),
(7,'Course Enrollment Request','Your request to enroll in course 11 has been submitted and is pending approval.','2026-04-20 15:12:26'),
(8,'Timetable Updated','A new timetable  has been applied with 72 slots.','2026-04-20 15:35:23'),
(9,'Reschedule Request Update','Ayesha Khan\'s request for Intro to Programming on Tuesday has been rejected.','2026-04-20 16:12:30'),
(10,'Reschedule Request Update','Ayesha Khan\'s request for Intro to Programming on Tuesday has been rejected.','2026-04-20 16:14:05'),
(11,'Reschedule Request Update','Ayesha Khan\'s request for Intro to Programming on Tuesday has been rejected.','2026-04-20 16:19:56'),
(12,'Reschedule Request Update','Ayesha Khan\'s request for Intro to Programming on Tuesday has been rejected.','2026-04-20 16:21:19'),
(13,'Reschedule Request Update','Ayesha Khan\'s request for Intro to Programming on Tuesday has been rejected.','2026-04-20 16:36:27'),
(14,'Class Rescheduled','Your class for Intro to Programming has been rescheduled. Please check timetable.','2026-04-20 16:36:50'),
(15,'Reschedule Request Update','Ayesha Khan\'s request for Intro to Programming on Tuesday has been rejected.','2026-04-20 16:45:54'),
(16,'Class Rescheduled','Your class for Intro to Programming has been rescheduled. Please check timetable.','2026-04-20 16:46:55'),
(17,'Timetable Updated','A new timetable  has been applied with 72 slots.','2026-04-09 16:56:27'),
(18,'Timetable Updated','A new timetable  has been applied with 72 slots.','2026-04-09 16:59:08'),
(19,'Class Rescheduled','Your class for Intro to Programming has been rescheduled. Please check timetable.','2026-04-09 17:04:57');
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `reschedule_requests`
--

DROP TABLE IF EXISTS `reschedule_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `reschedule_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `slot_id` int(11) NOT NULL,
  `teacher_id` int(11) NOT NULL,
  `preferred_day_id` int(11) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `teacher_id` (`teacher_id`),
  KEY `preferred_day_id` (`preferred_day_id`),
  KEY `fk_reschedule_requests_slot` (`slot_id`),
  CONSTRAINT `fk_reschedule_requests_slot` FOREIGN KEY (`slot_id`) REFERENCES `timetable_slots` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reschedule_requests_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`),
  CONSTRAINT `reschedule_requests_ibfk_3` FOREIGN KEY (`preferred_day_id`) REFERENCES `week_days` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reschedule_requests`
--

LOCK TABLES `reschedule_requests` WRITE;
/*!40000 ALTER TABLE `reschedule_requests` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `reschedule_requests` VALUES
(50,2067,2,3,'test','approved','2026-04-09 12:04:19');
/*!40000 ALTER TABLE `reschedule_requests` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `rescheduled_slots`
--

DROP TABLE IF EXISTS `rescheduled_slots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `rescheduled_slots` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `slot_id` int(11) NOT NULL,
  `reschedule_date` date NOT NULL,
  `new_day_id` int(11) NOT NULL,
  `new_start_time` time NOT NULL,
  `new_end_time` time NOT NULL,
  `new_classroom_id` int(11) DEFAULT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `status` enum('active','cancelled') DEFAULT 'active',
  `rescheduled_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `request_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `new_day_id` (`new_day_id`),
  KEY `new_classroom_id` (`new_classroom_id`),
  KEY `rescheduled_by` (`rescheduled_by`),
  KEY `fk_reschedule_slot` (`slot_id`),
  KEY `fk_reschedule_request` (`request_id`),
  CONSTRAINT `fk_reschedule_request` FOREIGN KEY (`request_id`) REFERENCES `reschedule_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reschedule_slot` FOREIGN KEY (`slot_id`) REFERENCES `timetable_slots` (`id`) ON DELETE CASCADE,
  CONSTRAINT `rescheduled_slots_ibfk_2` FOREIGN KEY (`new_day_id`) REFERENCES `week_days` (`id`),
  CONSTRAINT `rescheduled_slots_ibfk_3` FOREIGN KEY (`new_classroom_id`) REFERENCES `classrooms` (`id`),
  CONSTRAINT `rescheduled_slots_ibfk_4` FOREIGN KEY (`rescheduled_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rescheduled_slots`
--

LOCK TABLES `rescheduled_slots` WRITE;
/*!40000 ALTER TABLE `rescheduled_slots` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `rescheduled_slots` VALUES
(33,2067,'2026-04-13',1,'08:00:00','08:50:00',1,'test','active',NULL,'2026-04-09 12:04:57',50);
/*!40000 ALTER TABLE `rescheduled_slots` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `student_courses`
--

DROP TABLE IF EXISTS `student_courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_courses` (
  `student_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `status` enum('requested','enrolled','completed','failed','dropped','rejected') DEFAULT NULL,
  PRIMARY KEY (`student_id`,`course_id`),
  CONSTRAINT `student_courses_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_courses`
--

LOCK TABLES `student_courses` WRITE;
/*!40000 ALTER TABLE `student_courses` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `student_courses` VALUES
(101,1,'enrolled'),
(101,8,'enrolled'),
(101,13,'enrolled'),
(101,17,'enrolled'),
(102,1,'rejected'),
(102,8,'rejected'),
(102,13,'rejected'),
(102,17,'rejected'),
(103,1,'enrolled'),
(103,8,'enrolled'),
(103,13,'enrolled'),
(103,17,'enrolled'),
(104,1,'enrolled'),
(104,8,'enrolled'),
(104,13,'enrolled'),
(104,17,'enrolled'),
(105,1,'enrolled'),
(105,8,'enrolled'),
(105,13,'enrolled'),
(105,17,'enrolled'),
(106,1,'completed'),
(106,2,'completed'),
(106,8,'enrolled'),
(106,9,'enrolled'),
(107,8,'completed'),
(107,9,'completed'),
(107,13,'enrolled'),
(107,17,'enrolled'),
(108,8,'completed'),
(108,9,'completed'),
(108,10,'enrolled'),
(108,11,'enrolled'),
(109,8,'completed'),
(109,9,'completed'),
(109,13,'enrolled'),
(109,17,'enrolled'),
(110,8,'completed'),
(110,9,'completed'),
(110,10,'enrolled'),
(110,11,'requested'),
(111,3,'enrolled'),
(111,4,'enrolled'),
(111,10,'completed'),
(111,12,'completed'),
(112,5,'enrolled'),
(112,6,'enrolled'),
(112,10,'completed'),
(112,12,'completed'),
(113,1,'enrolled'),
(113,8,'enrolled'),
(113,13,'enrolled'),
(113,17,'enrolled'),
(114,8,'enrolled'),
(114,9,'enrolled'),
(114,13,'completed'),
(114,14,'completed'),
(115,1,'enrolled'),
(115,8,'enrolled'),
(115,13,'enrolled'),
(115,17,'enrolled'),
(116,13,'completed'),
(116,14,'completed'),
(116,15,'enrolled'),
(116,16,'enrolled'),
(117,8,'enrolled'),
(117,9,'enrolled'),
(117,13,'completed'),
(117,14,'completed'),
(118,12,'enrolled'),
(118,15,'completed'),
(118,16,'completed'),
(118,20,'enrolled'),
(119,1,'enrolled'),
(119,8,'enrolled'),
(119,13,'enrolled'),
(119,17,'enrolled'),
(120,8,'enrolled'),
(120,9,'enrolled'),
(120,17,'completed'),
(120,18,'completed'),
(121,17,'completed'),
(121,18,'completed'),
(121,19,'enrolled'),
(121,20,'enrolled'),
(122,1,'enrolled'),
(122,8,'enrolled'),
(122,13,'enrolled'),
(122,17,'requested'),
(123,8,'enrolled'),
(123,9,'enrolled'),
(123,17,'completed'),
(123,18,'completed'),
(124,10,'enrolled'),
(124,12,'enrolled'),
(124,19,'completed'),
(124,20,'completed');
/*!40000 ALTER TABLE `student_courses` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `user_id` int(11) NOT NULL,
  `department_id` int(11) NOT NULL,
  `semester` int(11) NOT NULL,
  PRIMARY KEY (`user_id`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `students_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `students_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `students` VALUES
(101,1,1),
(102,1,1),
(103,1,1),
(104,1,1),
(105,1,1),
(106,1,2),
(107,2,2),
(108,2,3),
(109,2,2),
(110,2,3),
(111,2,4),
(112,2,5),
(113,3,1),
(114,3,2),
(115,3,1),
(116,3,3),
(117,3,2),
(118,3,4),
(119,4,1),
(120,4,2),
(121,4,3),
(122,4,1),
(123,4,2),
(124,4,4);
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `teacher_availability`
--

DROP TABLE IF EXISTS `teacher_availability`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `teacher_availability` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `teacher_id` int(11) NOT NULL,
  `day_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_teacher_day` (`teacher_id`,`day_id`),
  KEY `fk_day` (`day_id`),
  CONSTRAINT `fk_day` FOREIGN KEY (`day_id`) REFERENCES `week_days` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teacher_availability`
--

LOCK TABLES `teacher_availability` WRITE;
/*!40000 ALTER TABLE `teacher_availability` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `teacher_availability` VALUES
(1,2,1),
(2,2,3),
(3,2,5),
(4,3,1),
(5,3,4),
(6,4,2),
(7,4,4),
(8,5,1),
(9,5,3),
(10,6,2),
(11,6,5),
(12,7,1),
(13,7,3),
(14,7,5),
(33,8,2),
(34,8,4),
(17,9,3),
(18,9,5),
(19,125,1),
(20,125,2),
(21,125,3),
(22,125,4),
(23,125,5),
(24,126,1),
(25,126,2),
(26,126,3),
(27,126,4),
(28,126,5);
/*!40000 ALTER TABLE `teacher_availability` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `teacher_departments`
--

DROP TABLE IF EXISTS `teacher_departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `teacher_departments` (
  `teacher_id` int(11) NOT NULL,
  `department_id` int(11) NOT NULL,
  PRIMARY KEY (`teacher_id`,`department_id`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `teacher_departments_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `teacher_departments_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teacher_departments`
--

LOCK TABLES `teacher_departments` WRITE;
/*!40000 ALTER TABLE `teacher_departments` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `teacher_departments` VALUES
(2,1),
(6,1),
(125,1),
(126,1),
(3,2),
(7,2),
(4,3),
(8,3),
(5,4),
(9,4),
(126,4);
/*!40000 ALTER TABLE `teacher_departments` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `teachers`
--

DROP TABLE IF EXISTS `teachers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `teachers` (
  `user_id` int(11) NOT NULL,
  `priority_time_start` time DEFAULT NULL,
  `priority_time_end` time DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `teachers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teachers`
--

LOCK TABLES `teachers` WRITE;
/*!40000 ALTER TABLE `teachers` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `teachers` VALUES
(2,'09:00:00','11:00:00'),
(3,'10:00:00','12:00:00'),
(4,'08:30:00','10:30:00'),
(5,'13:00:00','15:00:00'),
(6,'11:00:00','13:00:00'),
(7,'14:00:00','16:00:00'),
(8,'09:30:00','11:30:00'),
(9,'15:00:00','17:00:00'),
(125,'09:00:00','15:00:00'),
(126,'09:00:00','15:00:00');
/*!40000 ALTER TABLE `teachers` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `timetable_slots`
--

DROP TABLE IF EXISTS `timetable_slots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `timetable_slots` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `timetable_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `department_id` int(11) NOT NULL,
  `day_id` int(11) NOT NULL,
  `classroom_id` int(11) NOT NULL,
  `merge_id` int(11) DEFAULT NULL,
  `label` enum('single','combined') NOT NULL DEFAULT 'single',
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `penalty` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `fk_ts_timetable` (`timetable_id`),
  KEY `fk_ts_course` (`course_id`),
  KEY `fk_ts_department` (`department_id`),
  KEY `fk_ts_day` (`day_id`),
  KEY `fk_ts_classroom` (`classroom_id`),
  KEY `fk_ts_merge` (`merge_id`),
  CONSTRAINT `fk_ts_classroom` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms` (`id`),
  CONSTRAINT `fk_ts_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`),
  CONSTRAINT `fk_ts_day` FOREIGN KEY (`day_id`) REFERENCES `week_days` (`id`),
  CONSTRAINT `fk_ts_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`),
  CONSTRAINT `fk_ts_merge` FOREIGN KEY (`merge_id`) REFERENCES `course_merges` (`id`),
  CONSTRAINT `fk_ts_timetable` FOREIGN KEY (`timetable_id`) REFERENCES `timetables` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2136 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `timetable_slots`
--

LOCK TABLES `timetable_slots` WRITE;
/*!40000 ALTER TABLE `timetable_slots` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `timetable_slots` VALUES
(2064,30,12,2,1,4,NULL,'single','09:05:00','09:55:00',67),
(2065,30,23,1,1,5,NULL,'single','09:05:00','09:55:00',4),
(2066,30,26,1,1,3,NULL,'single','09:05:00','09:55:00',80),
(2067,30,1,1,1,6,2,'combined','09:05:00','09:55:00',-14),
(2068,30,3,1,1,6,2,'combined','09:05:00','09:55:00',-14),
(2069,30,10,2,1,5,NULL,'single','10:10:00','11:00:00',1),
(2070,30,17,4,1,4,NULL,'single','10:10:00','11:00:00',75),
(2071,30,5,1,1,3,NULL,'single','10:10:00','11:00:00',9),
(2072,30,11,2,1,3,NULL,'single','11:15:00','12:05:00',64),
(2073,30,12,2,1,5,NULL,'single','11:15:00','12:05:00',37),
(2074,30,17,4,1,4,NULL,'single','11:15:00','12:05:00',40),
(2075,30,19,4,1,5,NULL,'single','15:35:00','16:25:00',48),
(2076,30,8,2,1,4,1,'combined','15:35:00','16:25:00',41),
(2077,30,9,2,1,4,1,'combined','15:35:00','16:25:00',41),
(2078,30,19,4,1,5,NULL,'single','16:40:00','17:30:00',83),
(2079,30,8,2,1,4,1,'combined','16:40:00','17:30:00',86),
(2080,30,9,2,1,4,1,'combined','16:40:00','17:30:00',86),
(2081,30,13,3,2,4,NULL,'single','08:00:00','08:50:00',54),
(2082,30,16,3,2,5,NULL,'single','08:00:00','08:50:00',73),
(2083,30,2,1,2,3,NULL,'single','08:00:00','08:50:00',95),
(2084,30,13,3,2,4,NULL,'single','09:05:00','09:55:00',-6),
(2085,30,16,3,2,5,NULL,'single','09:05:00','09:55:00',38),
(2086,30,6,1,2,3,NULL,'single','09:05:00','09:55:00',84),
(2087,30,13,3,2,4,NULL,'single','10:10:00','11:00:00',54),
(2088,30,14,3,2,5,NULL,'single','10:10:00','11:00:00',4),
(2089,30,6,1,2,3,NULL,'single','10:10:00','11:00:00',44),
(2090,30,14,3,2,4,NULL,'single','11:15:00','12:05:00',64),
(2091,30,15,3,2,5,NULL,'single','11:15:00','12:05:00',48),
(2092,30,4,1,2,3,NULL,'single','11:15:00','12:05:00',9),
(2093,30,2,1,2,4,NULL,'single','15:35:00','16:25:00',69),
(2094,30,7,1,2,4,NULL,'single','16:40:00','17:30:00',79),
(2095,30,23,1,3,4,NULL,'single','09:05:00','09:55:00',4),
(2096,30,26,1,3,5,NULL,'single','09:05:00','09:55:00',99),
(2097,30,1,1,3,3,2,'combined','09:05:00','09:55:00',-19),
(2098,30,3,1,3,3,2,'combined','09:05:00','09:55:00',-19),
(2099,30,17,4,3,4,NULL,'single','10:10:00','11:00:00',75),
(2100,30,24,1,3,5,NULL,'single','10:10:00','11:00:00',4),
(2101,30,5,1,3,3,NULL,'single','10:10:00','11:00:00',9),
(2102,30,17,4,3,4,NULL,'single','11:15:00','12:05:00',40),
(2103,30,20,4,3,5,NULL,'single','11:15:00','12:05:00',67),
(2104,30,18,4,3,5,NULL,'single','15:35:00','16:25:00',4),
(2105,30,19,4,3,3,NULL,'single','15:35:00','16:25:00',54),
(2106,30,8,2,3,4,1,'combined','15:35:00','16:25:00',41),
(2107,30,9,2,3,4,1,'combined','15:35:00','16:25:00',41),
(2108,30,11,2,3,4,NULL,'single','16:40:00','17:30:00',48),
(2109,30,18,4,3,5,NULL,'single','16:40:00','17:30:00',64),
(2110,30,26,1,3,3,NULL,'single','16:40:00','17:30:00',65),
(2111,30,15,3,4,4,NULL,'single','08:00:00','08:50:00',38),
(2112,30,12,2,4,5,NULL,'single','09:05:00','09:55:00',42),
(2113,30,13,3,4,4,NULL,'single','09:05:00','09:55:00',-6),
(2114,30,16,3,4,3,NULL,'single','09:05:00','09:55:00',44),
(2115,30,10,2,4,4,NULL,'single','10:10:00','11:00:00',1),
(2116,30,14,3,4,5,NULL,'single','10:10:00','11:00:00',4),
(2117,30,15,3,4,3,NULL,'single','10:10:00','11:00:00',69),
(2118,30,10,2,4,4,NULL,'single','11:15:00','12:05:00',61),
(2119,30,14,3,4,5,NULL,'single','11:15:00','12:05:00',64),
(2120,30,2,1,5,4,NULL,'single','08:00:00','08:50:00',64),
(2121,30,23,1,5,4,NULL,'single','09:05:00','09:55:00',4),
(2122,30,6,1,5,3,NULL,'single','09:05:00','09:55:00',59),
(2123,30,1,1,5,5,2,'combined','09:05:00','09:55:00',-25),
(2124,30,3,1,5,5,2,'combined','09:05:00','09:55:00',-25),
(2125,30,4,1,5,4,NULL,'single','10:10:00','11:00:00',63),
(2126,30,5,1,5,5,NULL,'single','10:10:00','11:00:00',3),
(2127,30,20,4,5,4,NULL,'single','11:15:00','12:05:00',92),
(2128,30,4,1,5,5,NULL,'single','11:15:00','12:05:00',3),
(2129,30,18,4,5,5,NULL,'single','15:35:00','16:25:00',4),
(2130,30,7,1,5,3,NULL,'single','15:35:00','16:25:00',75),
(2131,30,8,2,5,4,1,'combined','15:35:00','16:25:00',41),
(2132,30,9,2,5,4,1,'combined','15:35:00','16:25:00',41),
(2133,30,11,2,5,4,NULL,'single','16:40:00','17:30:00',48),
(2134,30,20,4,5,5,NULL,'single','16:40:00','17:30:00',37),
(2135,30,7,1,5,3,NULL,'single','16:40:00','17:30:00',110);
/*!40000 ALTER TABLE `timetable_slots` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `timetables`
--

DROP TABLE IF EXISTS `timetables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `timetables` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `configuration_id` int(11) NOT NULL,
  `label` varchar(100) NOT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_configuration` (`configuration_id`),
  KEY `fk_user` (`created_by`),
  CONSTRAINT `fk_configuration` FOREIGN KEY (`configuration_id`) REFERENCES `configurations` (`id`),
  CONSTRAINT `fk_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `timetables`
--

LOCK TABLES `timetables` WRITE;
/*!40000 ALTER TABLE `timetables` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `timetables` VALUES
(30,1,'Spring 2026 - User 1',1,'2026-04-09 11:59:08');
/*!40000 ALTER TABLE `timetables` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','student','teacher') NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=127 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `users` VALUES
(1,'Admin User','admin@stmu.edu.pk','Admin@123','admin','2026-03-29 16:11:38'),
(2,'Ayesha Khan','ayesha.khan@stmu.edu.pk','Teacher@123','teacher','2026-03-29 16:11:38'),
(3,'Bilal Ahmed','bilal.ahmed@stmu.edu.pk','Teacher@123','teacher','2026-03-29 16:11:38'),
(4,'Sara Iqbal','sara.iqbal@stmu.edu.pk','Teacher@123','teacher','2026-03-29 16:11:38'),
(5,'Hamza Malik','hamza.malik@stmu.edu.pk','Teacher@123','teacher','2026-03-29 16:11:38'),
(6,'Nadia Hussain','nadia.hussain@stmu.edu.pk','Teacher@123','teacher','2026-03-29 16:11:38'),
(7,'Omar Farooq','omar.farooq@stmu.edu.pk','Teacher@123','teacher','2026-03-29 16:11:38'),
(8,'Amina Saleem','amina.saleem@stmu.edu.pk','Teacher@123','teacher','2026-03-29 16:11:38'),
(9,'Zain Siddiqui','zain.siddiqui@stmu.edu.pk','Teacher@123','teacher','2026-03-29 16:11:38'),
(101,'Mahnoor Ali','mahnoor.ali@stmu.edu.pk','Student@123','student','2026-03-29 16:11:38'),
(102,'Usman Tariq','usman.tariq@stmu.edu.pk','Student@123','student','2026-03-29 16:11:38'),
(103,'Hira Shah','hira.shah@stmu.edu.pk','Student@123','student','2026-03-29 16:11:38'),
(104,'Ahmed Raza','ahmed.raza@stmu.edu.pk','Student@123','student','2026-03-29 16:11:38'),
(105,'Noor Fatima','noor.fatima@stmu.edu.pk','Student@123','student','2026-03-29 16:11:38'),
(106,'Daniyal Ahsan','daniyal.ahsan@stmu.edu.pk','Student@123','student','2026-03-29 16:11:38'),
(107,'Saba Javed','saba.javed@stmu.edu.pk','Student@123','student','2026-03-29 16:11:38'),
(108,'Hamza Ali','hamza.ali@stmu.edu.pk','Student@123','student','2026-03-29 16:11:38'),
(109,'Eman Khan','eman.khan@stmu.edu.pk','Student@123','student','2026-03-29 16:11:38'),
(110,'Abdul Rehman','abdul.rehman@stmu.edu.pk','Student@123','student','2026-03-29 16:11:38'),
(111,'Areeba Malik','areeba.malik@stmu.edu.pk','Student@123','student','2026-03-29 16:11:38'),
(112,'Saad Qureshi','saad.qureshi@stmu.edu.pk','Student@123','student','2026-03-29 16:11:38'),
(113,'Maryam Noor','maryam.noor@stmu.edu.pk','Student@123','student','2026-03-29 16:11:38'),
(114,'Ali Hasan','ali.hasan@stmu.edu.pk','Student@123','student','2026-03-29 16:11:38'),
(115,'Zunaira Ahmad','zunaira.ahmad@stmu.edu.pk','Student@123','student','2026-03-29 16:11:38'),
(116,'Mustafa Khan','mustafa.khan@stmu.edu.pk','Student@123','student','2026-03-29 16:11:38'),
(117,'Laiba Iqbal','laiba.iqbal@stmu.edu.pk','Student@123','student','2026-03-29 16:11:38'),
(118,'Furqan Aziz','furqan.aziz@stmu.edu.pk','Student@123','student','2026-03-29 16:11:38'),
(119,'Hania Sohail','hania.sohail@stmu.edu.pk','Student@123','student','2026-03-29 16:11:38'),
(120,'Talha Nadeem','talha.nadeem@stmu.edu.pk','Student@123','student','2026-03-29 16:11:38'),
(121,'Rabia Khan','rabia.khan@stmu.edu.pk','Student@123','student','2026-03-29 16:11:38'),
(122,'Bilal Naseer','bilal.naseer@stmu.edu.pk','Student@123','student','2026-03-29 16:11:38'),
(123,'Khadija Butt','khadija.butt@stmu.edu.pk','Student@123','student','2026-03-29 16:11:38'),
(124,'Imran Saleem','imran.saleem@stmu.edu.pk','Student@123','student','2026-03-29 16:11:38'),
(125,'Ms Zarwa Nawaz','zarwa.nawaz@stmu.edu.pk','Teacher@123','teacher','2026-03-29 20:13:41'),
(126,'Dr Amir Zaheer','amir.zaheer@stmu.edu.pk','Teacher@123','teacher','2026-03-30 09:30:46');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `week_days`
--

DROP TABLE IF EXISTS `week_days`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `week_days` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(10) NOT NULL,
  `is_holiday` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `week_days`
--

LOCK TABLES `week_days` WRITE;
/*!40000 ALTER TABLE `week_days` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `week_days` VALUES
(1,'Monday',0),
(2,'Tuesday',0),
(3,'Wednesday',0),
(4,'Thursday',0),
(5,'Friday',0),
(6,'Saturday',1),
(7,'Sunday',1);
/*!40000 ALTER TABLE `week_days` ENABLE KEYS */;
UNLOCK TABLES;
commit;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-04-09 19:37:28
