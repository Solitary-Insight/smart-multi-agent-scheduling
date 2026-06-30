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
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `configurations`
--

LOCK TABLES `configurations` WRITE;
/*!40000 ALTER TABLE `configurations` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `configurations` VALUES
(1,'SEMESTER_CONFIGURATIONS','{\"semesterName\":\"Spring 2026\",\"startDate\":\"2026-02-16\",\"endDate\":\"2026-06-06\",\"maxCredits\":18,\"minCredits\":0,\"slotDuration\":60,\"break_between_classes\":0,\"dayStart\":\"08:00\",\"dayEnd\":\"16:30\",\"allowConflicts\":false,\"autoNotify\":false,\"requireApproval\":true,\"maxClassSize\":35,\"enrollmentOpen\":true,\"weekStart\":1}','Configurations for semester','2026-03-29 16:11:38','2026-06-22 19:00:35');
/*!40000 ALTER TABLE `configurations` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `course_departments`
--

DROP TABLE IF EXISTS `course_departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_departments` (
  `course_id` int(11) NOT NULL,
  `department_id` int(11) NOT NULL,
  PRIMARY KEY (`course_id`,`department_id`),
  KEY `fk_cd_course` (`course_id`),
  KEY `fk_cd_department` (`department_id`),
  CONSTRAINT `fk_cd_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cd_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `course_departments`
--

LOCK TABLES `course_departments` WRITE;
/*!40000 ALTER TABLE `course_departments` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `course_departments` VALUES
(1,1),
(2,1),
(3,1),
(4,1),
(5,1),
(6,1),
(6,5),
(6,6),
(6,7),
(7,1),
(8,2),
(9,2),
(10,2),
(11,2),
(12,2),
(13,3),
(14,3),
(15,3),
(16,3),
(17,4),
(18,4),
(19,4),
(20,4),
(23,1),
(24,1),
(26,1),
(27,1),
(27,5),
(27,6),
(27,7),
(28,5),
(29,1),
(29,5),
(30,5);
/*!40000 ALTER TABLE `course_departments` ENABLE KEYS */;
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
(20,18),
(24,26),
(24,29);
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
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses`
--

LOCK TABLES `courses` WRITE;
/*!40000 ALTER TABLE `courses` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `courses` VALUES
(1,'Intro to Programming','CS101',1,3,1,3,'Foundational programming using Python and problem solving.'),
(2,'Object-Oriented Programming','CS102',1,6,2,3,'Classes, objects, inheritance, and modular design.'),
(3,'Data Structures','CS201',1,126,3,3,'Lists, stacks, queues, trees, and hash tables.'),
(4,'Database Systems','CS202',1,6,4,3,'Relational modeling, SQL, normalization, and transactions.'),
(5,'Operating Systems','CS301',1,4,5,3,'Processes, threads, memory management, and scheduling.'),
(6,'Software Engineering','CS302',1,6,6,3,'Requirements, design, testing, and project delivery.'),
(7,'Web Development','CS303',1,6,5,3,'Client-server web applications and modern frameworks.'),
(8,'Calculus I','MATH101',2,9,1,4,'Limits, derivatives, and introductory applications.'),
(9,'Calculus II','MATH102',2,4,2,4,'Integration techniques and applications of calculus.'),
(10,'Linear Algebra','MATH201',2,3,3,3,'Vectors, matrices, eigenvalues, and systems of equations.'),
(11,'Discrete Mathematics','MATH202',2,126,2,3,'Logic, proofs, combinatorics, and graph theory.'),
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
(26,'Numerical Computing','CS-230',1,5,3,3,''),
(27,'Pak Study','CS 403',7,2,8,2,''),
(28,'Entreprenuership','CS402',5,4,8,2,''),
(29,'DevOps','CS401',1,5,8,3,''),
(30,'Software Re-Engineering','CS405',5,8,8,3,''),
(31,'Machine Learning','ML101',7,3,8,3,'');
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `departments` VALUES
(1,'Computer Science',125,'2026-03-29 16:11:38','CS'),
(2,'Mathematics',3,'2026-03-29 16:11:38','MATH'),
(3,'Physics',4,'2026-03-29 16:11:38','PHYS'),
(4,'Electrical Engineering',5,'2026-03-29 16:11:38','EE'),
(5,'Software Engineering',4,'2026-06-10 15:17:47','BSSE'),
(6,'Cyber Security',9,'2026-06-10 15:17:58','BSCYS'),
(7,'Artifical Intelligence',9,'2026-06-10 15:18:10','BSAI');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;
commit;

--
-- Table structure for table `login_sessions`
--

DROP TABLE IF EXISTS `login_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `login_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `otp_code` varchar(6) DEFAULT NULL,
  `is_otp_verified` tinyint(1) DEFAULT 0,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `verified_at` timestamp NULL DEFAULT NULL,
  `session_token` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_token` (`session_token`),
  KEY `idx_user_otp` (`user_id`,`otp_code`),
  CONSTRAINT `fk_user_session` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `login_sessions`
--

LOCK TABLES `login_sessions` WRITE;
/*!40000 ALTER TABLE `login_sessions` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `login_sessions` VALUES
(31,8,'::ffff:127.0.0.1','Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0','138791',1,'2026-05-25 00:38:17','2026-04-25 00:36:52','2026-04-25 00:38:17','60f3379dd895a21fedf574a633b2fac17b87935bedb1b03014eea44171dc3f0a'),
(41,101,'::1','Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36','189359',0,'2026-05-18 21:03:05','2026-05-18 20:53:05',NULL,'28a63b24d411be7871e177badea97ede68dc2ef1aa08c0d2eea737fe3308c072'),
(47,133,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','588377',1,'2026-06-19 20:33:46','2026-05-19 20:33:29','2026-05-19 20:33:46','42eb73b47b104f0aa14dee06507928d63f1d314f196b5db13c1dcfbfdf682e41'),
(48,1,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Cursor/3.5.17 Chrome/142.0.7444.265 Electron/39.8.1 Safari/537.36','288781',1,'2026-06-20 14:25:44','2026-05-20 14:21:24','2026-05-20 14:25:44','2ed59d2af03ca59c16bd6976c03fc7652d271daffe8cd969710e6a7edc3bcbe3'),
(52,134,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','565888',0,'2026-07-10 16:51:15','2026-06-10 16:50:54',NULL,'d04a653637743882fbc8f99edb76ad775c0a06dbb16ada96f2e1ef5a33716d68'),
(53,132,'::1','Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36','593904',1,'2026-07-10 18:50:00','2026-06-10 18:49:26','2026-06-10 18:50:00','2e78759e8b7ab187ef5586ef178066ad5ae4341e93b0ffceed81dcf232a94777'),
(54,132,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','662281',1,'2026-07-21 19:49:34','2026-06-21 19:48:57','2026-06-21 19:49:34','8cb25f7ed4a49b37800699a93e3ca929dad079f346d2bfd9aeb4c8c0423b4015'),
(58,2,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','136770',1,'2026-07-21 20:42:16','2026-06-21 20:41:24','2026-06-21 20:42:16','bba8c621b8e88f16865ca3bfc59b0b78da03d78cd0b272d6cc0d4cbec3c64f3e'),
(59,134,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36','492593',1,'2026-07-21 20:55:09','2026-06-21 20:54:48','2026-06-21 20:55:09','bfc5f410527b948dd279b56bf6adaf4743e48a60db03b6695510e29f749bfb9a'),
(60,110,'::ffff:127.0.0.1','Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0','212427',1,'2026-07-28 07:45:10','2026-06-28 07:44:30','2026-06-28 07:45:10','c21dda6db1b5d0a141571cdbb19d0613787bf4d39bf7157289d09f1e2d134dfb'),
(61,1,'::ffff:127.0.0.1','Mozilla/5.0 (Linux; Android 7.0; SM-G892A Build/NRD90M; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/109.0.0.0 Mobile Safari/537.36','807374',1,'2026-07-28 08:01:03','2026-06-28 08:00:47','2026-06-28 08:01:03','8780ad90212ba9dc01cbd299427f887dcda2fbde45639981c29cbf4406601d62'),
(62,8,'::1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36','292777',1,'2026-07-29 18:46:43','2026-06-29 18:45:41','2026-06-29 18:46:43','a4dc0c807c33e26d6cf40352395c6cc1ded5131fc615afb66c87bb07a612f980');
/*!40000 ALTER TABLE `login_sessions` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=1580 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `message_recipients`
--

LOCK TABLES `message_recipients` WRITE;
/*!40000 ALTER TABLE `message_recipients` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `message_recipients` VALUES
(1194,109,1,NULL,1,'2026-06-29 23:35:45'),
(1195,109,130,NULL,0,NULL),
(1196,109,132,NULL,0,NULL),
(1197,109,136,NULL,0,NULL),
(1198,110,110,NULL,1,'2026-06-29 23:51:27'),
(1199,111,1,NULL,1,'2026-06-29 23:35:45'),
(1200,111,130,NULL,0,NULL),
(1201,111,132,NULL,0,NULL),
(1202,111,136,NULL,0,NULL),
(1203,112,110,NULL,1,'2026-06-29 23:51:27'),
(1204,113,110,NULL,1,'2026-06-29 23:51:27'),
(1205,114,1,NULL,1,'2026-06-29 23:35:45'),
(1206,114,130,NULL,0,NULL),
(1207,114,132,NULL,0,NULL),
(1208,114,136,NULL,0,NULL),
(1209,115,110,NULL,1,'2026-06-29 23:51:27'),
(1210,116,110,NULL,1,'2026-06-29 23:51:27'),
(1211,117,110,NULL,1,'2026-06-29 23:51:27'),
(1212,118,1,NULL,1,'2026-06-29 23:35:45'),
(1213,118,130,NULL,0,NULL),
(1214,118,132,NULL,0,NULL),
(1215,118,136,NULL,0,NULL),
(1216,119,110,NULL,1,'2026-06-29 23:51:27'),
(1217,120,1,NULL,1,'2026-06-29 23:35:45'),
(1218,120,130,NULL,0,NULL),
(1219,120,132,NULL,0,NULL),
(1220,120,136,NULL,0,NULL),
(1221,121,110,NULL,1,'2026-06-29 23:51:27'),
(1222,122,1,NULL,1,'2026-06-29 23:35:45'),
(1223,122,130,NULL,0,NULL),
(1224,122,132,NULL,0,NULL),
(1225,122,136,NULL,0,NULL),
(1226,123,110,NULL,1,'2026-06-29 23:51:27'),
(1227,124,110,NULL,1,'2026-06-29 23:51:27'),
(1228,125,110,NULL,1,'2026-06-29 23:51:27'),
(1229,126,1,NULL,1,'2026-06-29 23:35:45'),
(1230,126,130,NULL,0,NULL),
(1231,126,132,NULL,0,NULL),
(1232,126,136,NULL,0,NULL),
(1233,127,110,NULL,1,'2026-06-29 23:51:27'),
(1234,128,110,NULL,1,'2026-06-29 23:51:27'),
(1235,129,1,NULL,1,'2026-06-29 23:35:45'),
(1236,129,3,NULL,0,NULL),
(1237,129,4,NULL,0,NULL),
(1238,129,5,NULL,0,NULL),
(1239,129,6,NULL,0,NULL),
(1240,129,8,NULL,1,'2026-06-29 23:51:45'),
(1241,129,9,NULL,0,NULL),
(1242,129,101,NULL,0,NULL),
(1243,129,103,NULL,0,NULL),
(1244,129,104,NULL,0,NULL),
(1245,129,105,NULL,0,NULL),
(1246,129,106,NULL,0,NULL),
(1247,129,107,NULL,0,NULL),
(1248,129,109,NULL,0,NULL),
(1249,129,110,NULL,1,'2026-06-29 23:51:27'),
(1250,129,111,NULL,0,NULL),
(1251,129,112,NULL,0,NULL),
(1252,129,113,NULL,0,NULL),
(1253,129,114,NULL,0,NULL),
(1254,129,115,NULL,0,NULL),
(1255,129,116,NULL,0,NULL),
(1256,129,117,NULL,0,NULL),
(1257,129,118,NULL,0,NULL),
(1258,129,119,NULL,0,NULL),
(1259,129,120,NULL,0,NULL),
(1260,129,121,NULL,0,NULL),
(1261,129,122,NULL,0,NULL),
(1262,129,123,NULL,0,NULL),
(1263,129,124,NULL,0,NULL),
(1264,129,125,NULL,0,NULL),
(1265,129,126,NULL,0,NULL),
(1266,129,130,NULL,0,NULL),
(1267,129,132,NULL,0,NULL),
(1268,129,133,NULL,0,NULL),
(1269,129,134,NULL,0,NULL),
(1270,129,135,NULL,0,NULL),
(1271,129,136,NULL,0,NULL),
(1272,129,380,NULL,0,NULL),
(1273,129,437,NULL,0,NULL),
(1274,129,438,NULL,0,NULL),
(1275,129,439,NULL,0,NULL),
(1276,129,440,NULL,0,NULL),
(1277,129,441,NULL,0,NULL),
(1278,129,443,NULL,0,NULL),
(1279,129,444,NULL,0,NULL),
(1280,129,445,NULL,0,NULL),
(1281,129,446,NULL,0,NULL),
(1282,129,447,NULL,0,NULL),
(1283,129,448,NULL,0,NULL),
(1284,129,449,NULL,0,NULL),
(1285,129,450,NULL,0,NULL),
(1286,129,451,NULL,0,NULL),
(1287,129,452,NULL,0,NULL),
(1288,129,453,NULL,0,NULL),
(1289,129,454,NULL,0,NULL),
(1290,129,455,NULL,0,NULL),
(1291,129,456,NULL,0,NULL),
(1292,129,457,NULL,0,NULL),
(1293,129,458,NULL,0,NULL),
(1294,129,459,NULL,0,NULL),
(1295,129,460,NULL,0,NULL),
(1296,129,461,NULL,0,NULL),
(1297,129,464,NULL,0,NULL),
(1298,129,465,NULL,0,NULL),
(1299,129,466,NULL,0,NULL),
(1300,129,467,NULL,0,NULL),
(1301,129,468,NULL,0,NULL),
(1302,129,469,NULL,0,NULL),
(1303,129,470,NULL,0,NULL),
(1304,130,1,NULL,1,'2026-06-29 23:35:45'),
(1305,130,3,NULL,0,NULL),
(1306,130,4,NULL,0,NULL),
(1307,130,5,NULL,0,NULL),
(1308,130,6,NULL,0,NULL),
(1309,130,8,NULL,1,'2026-06-29 23:51:45'),
(1310,130,9,NULL,0,NULL),
(1311,130,101,NULL,0,NULL),
(1312,130,103,NULL,0,NULL),
(1313,130,104,NULL,0,NULL),
(1314,130,105,NULL,0,NULL),
(1315,130,106,NULL,0,NULL),
(1316,130,107,NULL,0,NULL),
(1317,130,109,NULL,0,NULL),
(1318,130,110,NULL,1,'2026-06-29 23:51:27'),
(1319,130,111,NULL,0,NULL),
(1320,130,112,NULL,0,NULL),
(1321,130,113,NULL,0,NULL),
(1322,130,114,NULL,0,NULL),
(1323,130,115,NULL,0,NULL),
(1324,130,116,NULL,0,NULL),
(1325,130,117,NULL,0,NULL),
(1326,130,118,NULL,0,NULL),
(1327,130,119,NULL,0,NULL),
(1328,130,120,NULL,0,NULL),
(1329,130,121,NULL,0,NULL),
(1330,130,122,NULL,0,NULL),
(1331,130,123,NULL,0,NULL),
(1332,130,124,NULL,0,NULL),
(1333,130,125,NULL,0,NULL),
(1334,130,126,NULL,0,NULL),
(1335,130,130,NULL,0,NULL),
(1336,130,132,NULL,0,NULL),
(1337,130,133,NULL,0,NULL),
(1338,130,134,NULL,0,NULL),
(1339,130,135,NULL,0,NULL),
(1340,130,136,NULL,0,NULL),
(1341,130,380,NULL,0,NULL),
(1342,130,437,NULL,0,NULL),
(1343,130,438,NULL,0,NULL),
(1344,130,439,NULL,0,NULL),
(1345,130,440,NULL,0,NULL),
(1346,130,441,NULL,0,NULL),
(1347,130,443,NULL,0,NULL),
(1348,130,444,NULL,0,NULL),
(1349,130,445,NULL,0,NULL),
(1350,130,446,NULL,0,NULL),
(1351,130,447,NULL,0,NULL),
(1352,130,448,NULL,0,NULL),
(1353,130,449,NULL,0,NULL),
(1354,130,450,NULL,0,NULL),
(1355,130,451,NULL,0,NULL),
(1356,130,452,NULL,0,NULL),
(1357,130,453,NULL,0,NULL),
(1358,130,454,NULL,0,NULL),
(1359,130,455,NULL,0,NULL),
(1360,130,456,NULL,0,NULL),
(1361,130,457,NULL,0,NULL),
(1362,130,458,NULL,0,NULL),
(1363,130,459,NULL,0,NULL),
(1364,130,460,NULL,0,NULL),
(1365,130,461,NULL,0,NULL),
(1366,130,464,NULL,0,NULL),
(1367,130,465,NULL,0,NULL),
(1368,130,466,NULL,0,NULL),
(1369,130,467,NULL,0,NULL),
(1370,130,468,NULL,0,NULL),
(1371,130,469,NULL,0,NULL),
(1372,130,470,NULL,0,NULL),
(1373,131,1,NULL,1,'2026-06-29 23:35:45'),
(1374,131,3,NULL,0,NULL),
(1375,131,4,NULL,0,NULL),
(1376,131,5,NULL,0,NULL),
(1377,131,6,NULL,0,NULL),
(1378,131,8,NULL,1,'2026-06-29 23:51:45'),
(1379,131,9,NULL,0,NULL),
(1380,131,101,NULL,0,NULL),
(1381,131,103,NULL,0,NULL),
(1382,131,104,NULL,0,NULL),
(1383,131,105,NULL,0,NULL),
(1384,131,106,NULL,0,NULL),
(1385,131,107,NULL,0,NULL),
(1386,131,109,NULL,0,NULL),
(1387,131,110,NULL,1,'2026-06-29 23:51:27'),
(1388,131,111,NULL,0,NULL),
(1389,131,112,NULL,0,NULL),
(1390,131,113,NULL,0,NULL),
(1391,131,114,NULL,0,NULL),
(1392,131,115,NULL,0,NULL),
(1393,131,116,NULL,0,NULL),
(1394,131,117,NULL,0,NULL),
(1395,131,118,NULL,0,NULL),
(1396,131,119,NULL,0,NULL),
(1397,131,120,NULL,0,NULL),
(1398,131,121,NULL,0,NULL),
(1399,131,122,NULL,0,NULL),
(1400,131,123,NULL,0,NULL),
(1401,131,124,NULL,0,NULL),
(1402,131,125,NULL,0,NULL),
(1403,131,126,NULL,0,NULL),
(1404,131,130,NULL,0,NULL),
(1405,131,132,NULL,0,NULL),
(1406,131,133,NULL,0,NULL),
(1407,131,134,NULL,0,NULL),
(1408,131,135,NULL,0,NULL),
(1409,131,136,NULL,0,NULL),
(1410,131,380,NULL,0,NULL),
(1411,131,437,NULL,0,NULL),
(1412,131,438,NULL,0,NULL),
(1413,131,439,NULL,0,NULL),
(1414,131,440,NULL,0,NULL),
(1415,131,441,NULL,0,NULL),
(1416,131,443,NULL,0,NULL),
(1417,131,444,NULL,0,NULL),
(1418,131,445,NULL,0,NULL),
(1419,131,446,NULL,0,NULL),
(1420,131,447,NULL,0,NULL),
(1421,131,448,NULL,0,NULL),
(1422,131,449,NULL,0,NULL),
(1423,131,450,NULL,0,NULL),
(1424,131,451,NULL,0,NULL),
(1425,131,452,NULL,0,NULL),
(1426,131,453,NULL,0,NULL),
(1427,131,454,NULL,0,NULL),
(1428,131,455,NULL,0,NULL),
(1429,131,456,NULL,0,NULL),
(1430,131,457,NULL,0,NULL),
(1431,131,458,NULL,0,NULL),
(1432,131,459,NULL,0,NULL),
(1433,131,460,NULL,0,NULL),
(1434,131,461,NULL,0,NULL),
(1435,131,464,NULL,0,NULL),
(1436,131,465,NULL,0,NULL),
(1437,131,466,NULL,0,NULL),
(1438,131,467,NULL,0,NULL),
(1439,131,468,NULL,0,NULL),
(1440,131,469,NULL,0,NULL),
(1441,131,470,NULL,0,NULL),
(1442,132,1,NULL,0,NULL),
(1443,132,3,NULL,0,NULL),
(1444,132,4,NULL,0,NULL),
(1445,132,5,NULL,0,NULL),
(1446,132,6,NULL,0,NULL),
(1447,132,8,NULL,1,'2026-06-29 23:51:45'),
(1448,132,9,NULL,0,NULL),
(1449,132,101,NULL,0,NULL),
(1450,132,103,NULL,0,NULL),
(1451,132,104,NULL,0,NULL),
(1452,132,105,NULL,0,NULL),
(1453,132,106,NULL,0,NULL),
(1454,132,107,NULL,0,NULL),
(1455,132,109,NULL,0,NULL),
(1456,132,110,NULL,1,'2026-06-29 23:51:27'),
(1457,132,111,NULL,0,NULL),
(1458,132,112,NULL,0,NULL),
(1459,132,113,NULL,0,NULL),
(1460,132,114,NULL,0,NULL),
(1461,132,115,NULL,0,NULL),
(1462,132,116,NULL,0,NULL),
(1463,132,117,NULL,0,NULL),
(1464,132,118,NULL,0,NULL),
(1465,132,119,NULL,0,NULL),
(1466,132,120,NULL,0,NULL),
(1467,132,121,NULL,0,NULL),
(1468,132,122,NULL,0,NULL),
(1469,132,123,NULL,0,NULL),
(1470,132,124,NULL,0,NULL),
(1471,132,125,NULL,0,NULL),
(1472,132,126,NULL,0,NULL),
(1473,132,130,NULL,0,NULL),
(1474,132,132,NULL,0,NULL),
(1475,132,133,NULL,0,NULL),
(1476,132,134,NULL,0,NULL),
(1477,132,135,NULL,0,NULL),
(1478,132,136,NULL,0,NULL),
(1479,132,380,NULL,0,NULL),
(1480,132,437,NULL,0,NULL),
(1481,132,438,NULL,0,NULL),
(1482,132,439,NULL,0,NULL),
(1483,132,440,NULL,0,NULL),
(1484,132,441,NULL,0,NULL),
(1485,132,443,NULL,0,NULL),
(1486,132,444,NULL,0,NULL),
(1487,132,445,NULL,0,NULL),
(1488,132,446,NULL,0,NULL),
(1489,132,447,NULL,0,NULL),
(1490,132,448,NULL,0,NULL),
(1491,132,449,NULL,0,NULL),
(1492,132,450,NULL,0,NULL),
(1493,132,451,NULL,0,NULL),
(1494,132,452,NULL,0,NULL),
(1495,132,453,NULL,0,NULL),
(1496,132,454,NULL,0,NULL),
(1497,132,455,NULL,0,NULL),
(1498,132,456,NULL,0,NULL),
(1499,132,457,NULL,0,NULL),
(1500,132,458,NULL,0,NULL),
(1501,132,459,NULL,0,NULL),
(1502,132,460,NULL,0,NULL),
(1503,132,461,NULL,0,NULL),
(1504,132,464,NULL,0,NULL),
(1505,132,465,NULL,0,NULL),
(1506,132,466,NULL,0,NULL),
(1507,132,467,NULL,0,NULL),
(1508,132,468,NULL,0,NULL),
(1509,132,469,NULL,0,NULL),
(1510,132,470,NULL,0,NULL),
(1511,133,1,NULL,0,NULL),
(1512,133,3,NULL,0,NULL),
(1513,133,4,NULL,0,NULL),
(1514,133,5,NULL,0,NULL),
(1515,133,6,NULL,0,NULL),
(1516,133,8,NULL,0,NULL),
(1517,133,9,NULL,0,NULL),
(1518,133,101,NULL,0,NULL),
(1519,133,103,NULL,0,NULL),
(1520,133,104,NULL,0,NULL),
(1521,133,105,NULL,0,NULL),
(1522,133,106,NULL,0,NULL),
(1523,133,107,NULL,0,NULL),
(1524,133,109,NULL,0,NULL),
(1525,133,110,NULL,0,NULL),
(1526,133,111,NULL,0,NULL),
(1527,133,112,NULL,0,NULL),
(1528,133,113,NULL,0,NULL),
(1529,133,114,NULL,0,NULL),
(1530,133,115,NULL,0,NULL),
(1531,133,116,NULL,0,NULL),
(1532,133,117,NULL,0,NULL),
(1533,133,118,NULL,0,NULL),
(1534,133,119,NULL,0,NULL),
(1535,133,120,NULL,0,NULL),
(1536,133,121,NULL,0,NULL),
(1537,133,122,NULL,0,NULL),
(1538,133,123,NULL,0,NULL),
(1539,133,124,NULL,0,NULL),
(1540,133,125,NULL,0,NULL),
(1541,133,126,NULL,0,NULL),
(1542,133,130,NULL,0,NULL),
(1543,133,132,NULL,0,NULL),
(1544,133,133,NULL,0,NULL),
(1545,133,134,NULL,0,NULL),
(1546,133,135,NULL,0,NULL),
(1547,133,136,NULL,0,NULL),
(1548,133,380,NULL,0,NULL),
(1549,133,437,NULL,0,NULL),
(1550,133,438,NULL,0,NULL),
(1551,133,439,NULL,0,NULL),
(1552,133,440,NULL,0,NULL),
(1553,133,441,NULL,0,NULL),
(1554,133,443,NULL,0,NULL),
(1555,133,444,NULL,0,NULL),
(1556,133,445,NULL,0,NULL),
(1557,133,446,NULL,0,NULL),
(1558,133,447,NULL,0,NULL),
(1559,133,448,NULL,0,NULL),
(1560,133,449,NULL,0,NULL),
(1561,133,450,NULL,0,NULL),
(1562,133,451,NULL,0,NULL),
(1563,133,452,NULL,0,NULL),
(1564,133,453,NULL,0,NULL),
(1565,133,454,NULL,0,NULL),
(1566,133,455,NULL,0,NULL),
(1567,133,456,NULL,0,NULL),
(1568,133,457,NULL,0,NULL),
(1569,133,458,NULL,0,NULL),
(1570,133,459,NULL,0,NULL),
(1571,133,460,NULL,0,NULL),
(1572,133,461,NULL,0,NULL),
(1573,133,464,NULL,0,NULL),
(1574,133,465,NULL,0,NULL),
(1575,133,466,NULL,0,NULL),
(1576,133,467,NULL,0,NULL),
(1577,133,468,NULL,0,NULL),
(1578,133,469,NULL,0,NULL),
(1579,133,470,NULL,0,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=134 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `messages` VALUES
(109,'New Enrollment Request','Student ID 110 requested enrollment in course 23. Please review.','2026-06-28 14:47:50'),
(110,'Enrollment Request Sent','Your request for course 23 has been submitted and is pending approval.','2026-06-28 14:47:50'),
(111,'New Enrollment Request','Student ID 110 requested enrollment in course 24. Please review.','2026-06-28 14:53:02'),
(112,'Enrollment Request Sent','Your request for course 24 has been submitted and is pending approval.','2026-06-28 14:53:02'),
(113,'Course Withdrawn','You have successfully withdrawn from course 24.','2026-06-28 14:53:20'),
(114,'New Enrollment Request','Student ID 110 requested enrollment in course 24. Please review.','2026-06-28 14:54:38'),
(115,'Enrollment Request Sent','Your request for course 24 has been submitted and is pending approval.','2026-06-28 14:54:38'),
(116,'Course Withdrawn','You have successfully withdrawn from course 23.','2026-06-28 14:54:47'),
(117,'Enrollment Rejected','Your enrollment request has been rejected by admin.','2026-06-28 14:55:06'),
(118,'New Enrollment Request','Student ID 110 requested enrollment in course 23. Please review.','2026-06-28 15:01:06'),
(119,'Enrollment Request Sent','Your request for course 23 has been submitted and is pending approval.','2026-06-28 15:01:06'),
(120,'New Enrollment Request','Student ID 110 requested enrollment in course 24. Please review.','2026-06-28 15:01:08'),
(121,'Enrollment Request Sent','Your request for course 24 has been submitted and is pending approval.','2026-06-28 15:01:08'),
(122,'New Enrollment Request','Student ID 110 requested enrollment in course 26. Please review.','2026-06-28 15:01:10'),
(123,'Enrollment Request Sent','Your request for course 26 has been submitted and is pending approval.','2026-06-28 15:01:10'),
(124,'Enrollment Rejected','Your enrollment request has been rejected by admin.','2026-06-28 15:01:30'),
(125,'Enrollment Approved','Your enrollment request has been approved. You are now enrolled in the course.','2026-06-28 15:01:35'),
(126,'New Enrollment Request','Student ID 110 requested enrollment in course 23. Please review.','2026-06-28 15:02:10'),
(127,'Enrollment Request Sent','Your request for course 23 has been submitted and is pending approval.','2026-06-28 15:02:10'),
(128,'Enrollment Approved','Your enrollment request has been approved. You are now enrolled in the course.','2026-06-28 15:02:20'),
(129,'Timetable Updated','A new timetable  has been applied with 82 slots.','2026-06-28 15:09:40'),
(130,'Timetable Updated','A new timetable  has been applied with 74 slots.','2026-06-29 18:06:37'),
(131,'Timetable Updated','A new timetable  has been applied with 74 slots.','2026-06-29 23:35:37'),
(132,'Timetable Updated','A new timetable  has been applied with 76 slots.','2026-06-29 23:51:12'),
(133,'Timetable Updated','A new timetable  has been applied with 76 slots.','2026-06-29 23:52:07');
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
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reschedule_requests`
--

LOCK TABLES `reschedule_requests` WRITE;
/*!40000 ALTER TABLE `reschedule_requests` DISABLE KEYS */;
set autocommit=0;
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
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rescheduled_slots`
--

LOCK TABLES `rescheduled_slots` WRITE;
/*!40000 ALTER TABLE `rescheduled_slots` DISABLE KEYS */;
set autocommit=0;
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
(110,23,'enrolled'),
(110,24,'enrolled'),
(110,26,'enrolled'),
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
(122,17,'enrolled'),
(123,8,'enrolled'),
(123,9,'enrolled'),
(123,17,'completed'),
(123,18,'completed'),
(124,10,'enrolled'),
(124,12,'enrolled'),
(124,19,'completed'),
(124,20,'completed'),
(133,1,'enrolled'),
(133,23,'enrolled'),
(134,27,'enrolled'),
(134,28,'enrolled'),
(134,29,'enrolled'),
(134,30,'enrolled'),
(135,27,'enrolled'),
(135,28,'enrolled'),
(135,29,'enrolled');
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
(110,1,3),
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
(124,4,4),
(133,1,8),
(134,5,8),
(135,5,8),
(437,5,8),
(438,5,8),
(439,6,8),
(440,5,8),
(441,5,8),
(443,5,8),
(444,6,8),
(445,6,8),
(446,6,8),
(447,6,8),
(448,6,8),
(449,6,8),
(450,6,8),
(451,6,8),
(452,6,8),
(453,6,8),
(454,7,8),
(455,7,8),
(456,7,8),
(457,7,8),
(458,7,8),
(459,7,8),
(460,7,8),
(461,7,8),
(464,7,8),
(465,7,8),
(466,7,8),
(467,1,8),
(468,1,8),
(469,1,8),
(470,1,8);
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
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
(44,8,1),
(45,8,6),
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
(8,4),
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
) ENGINE=InnoDB AUTO_INCREMENT=4260 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `timetable_slots`
--

LOCK TABLES `timetable_slots` WRITE;
/*!40000 ALTER TABLE `timetable_slots` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `timetable_slots` VALUES
(4184,58,26,1,1,4,NULL,'single','08:00:00','09:00:00',78),
(4185,58,30,5,1,5,NULL,'single','08:00:00','09:00:00',43),
(4186,58,1,1,1,3,2,'combined','08:00:00','09:00:00',60),
(4187,58,3,1,1,3,2,'combined','08:00:00','09:00:00',60),
(4188,58,12,2,1,4,NULL,'single','09:00:00','10:00:00',37),
(4189,58,16,3,1,3,NULL,'single','09:00:00','10:00:00',44),
(4190,58,19,4,1,6,NULL,'single','09:00:00','10:00:00',79),
(4191,58,23,1,1,5,NULL,'single','09:00:00','10:00:00',2),
(4192,58,10,2,1,4,NULL,'single','10:00:00','11:00:00',1),
(4193,58,14,3,1,3,NULL,'single','10:00:00','11:00:00',10),
(4194,58,29,1,1,5,NULL,'single','10:00:00','11:00:00',82),
(4195,58,10,2,1,4,NULL,'single','11:00:00','12:00:00',26),
(4196,58,16,3,1,3,NULL,'single','11:00:00','12:00:00',69),
(4197,58,29,1,1,5,NULL,'single','11:00:00','12:00:00',47),
(4198,58,12,2,1,5,NULL,'single','12:00:00','13:00:00',62),
(4199,58,17,4,1,4,NULL,'single','12:00:00','13:00:00',54),
(4200,58,31,7,1,4,NULL,'single','13:00:00','14:00:00',49),
(4201,58,11,2,1,5,NULL,'single','14:00:00','15:00:00',3),
(4202,58,17,4,1,4,NULL,'single','14:00:00','15:00:00',-6),
(4203,58,13,3,2,4,NULL,'single','08:00:00','09:00:00',54),
(4204,58,7,1,2,5,NULL,'single','08:00:00','09:00:00',84),
(4205,58,13,3,2,4,NULL,'single','09:00:00','10:00:00',-6),
(4206,58,23,1,2,5,NULL,'single','09:00:00','10:00:00',2),
(4207,58,7,1,2,3,NULL,'single','09:00:00','10:00:00',55),
(4208,58,11,2,2,5,NULL,'single','10:00:00','11:00:00',3),
(4209,58,13,3,2,4,NULL,'single','10:00:00','11:00:00',54),
(4210,58,6,1,2,3,NULL,'single','10:00:00','11:00:00',69),
(4211,58,24,1,2,5,NULL,'single','11:00:00','12:00:00',3),
(4212,58,28,5,2,4,NULL,'single','11:00:00','12:00:00',42),
(4213,58,6,1,2,3,NULL,'single','11:00:00','12:00:00',9),
(4214,58,15,3,2,4,NULL,'single','12:00:00','13:00:00',53),
(4215,58,4,1,2,5,NULL,'single','12:00:00','13:00:00',3),
(4216,58,2,1,2,5,NULL,'single','14:00:00','15:00:00',49),
(4217,58,5,1,2,4,NULL,'single','14:00:00','15:00:00',73),
(4218,58,26,1,3,4,NULL,'single','08:00:00','09:00:00',103),
(4219,58,19,4,3,3,NULL,'single','09:00:00','10:00:00',74),
(4220,58,23,1,3,4,NULL,'single','09:00:00','10:00:00',2),
(4221,58,27,7,3,5,NULL,'single','09:00:00','10:00:00',2),
(4222,58,11,2,3,4,NULL,'single','10:00:00','11:00:00',3),
(4223,58,26,1,3,5,NULL,'single','10:00:00','11:00:00',58),
(4224,58,20,4,3,5,NULL,'single','11:00:00','12:00:00',67),
(4225,58,29,1,3,4,NULL,'single','11:00:00','12:00:00',47),
(4226,58,17,4,3,4,NULL,'single','12:00:00','13:00:00',54),
(4227,58,18,4,3,5,NULL,'single','12:00:00','13:00:00',84),
(4228,58,17,4,3,4,NULL,'single','14:00:00','15:00:00',-6),
(4229,58,18,4,3,5,NULL,'single','14:00:00','15:00:00',39),
(4230,58,28,5,4,4,NULL,'single','08:00:00','09:00:00',37),
(4231,58,1,1,4,5,2,'combined','08:00:00','09:00:00',79),
(4232,58,3,1,4,5,2,'combined','08:00:00','09:00:00',79),
(4233,58,13,3,4,4,NULL,'single','09:00:00','10:00:00',-6),
(4234,58,31,7,4,5,NULL,'single','09:00:00','10:00:00',39),
(4235,58,10,2,4,4,NULL,'single','10:00:00','11:00:00',1),
(4236,58,15,3,4,5,NULL,'single','10:00:00','11:00:00',38),
(4237,58,12,2,4,4,NULL,'single','11:00:00','12:00:00',2),
(4238,58,15,3,4,5,NULL,'single','11:00:00','12:00:00',68),
(4239,58,31,7,4,4,NULL,'single','12:00:00','13:00:00',64),
(4240,58,5,1,4,5,NULL,'single','12:00:00','13:00:00',53),
(4241,58,5,1,4,5,NULL,'single','14:00:00','15:00:00',98),
(4242,58,1,1,4,4,2,'combined','14:00:00','15:00:00',29),
(4243,58,3,1,4,4,2,'combined','14:00:00','15:00:00',29),
(4244,58,7,1,5,4,NULL,'single','08:00:00','09:00:00',59),
(4245,58,2,1,5,5,NULL,'single','09:00:00','10:00:00',49),
(4246,58,27,7,5,4,NULL,'single','09:00:00','10:00:00',2),
(4247,58,6,1,5,4,NULL,'single','10:00:00','11:00:00',38),
(4248,58,20,4,5,4,NULL,'single','11:00:00','12:00:00',92),
(4249,58,4,1,5,5,NULL,'single','11:00:00','12:00:00',3),
(4250,58,20,4,5,4,NULL,'single','12:00:00','13:00:00',57),
(4251,58,4,1,5,5,NULL,'single','12:00:00','13:00:00',28),
(4252,58,18,4,5,4,NULL,'single','14:00:00','15:00:00',39),
(4253,58,2,1,5,5,NULL,'single','14:00:00','15:00:00',74),
(4254,58,14,3,6,4,NULL,'single','08:00:00','09:00:00',69),
(4255,58,30,5,6,4,NULL,'single','09:00:00','10:00:00',63),
(4256,58,30,5,6,4,NULL,'single','10:00:00','11:00:00',3),
(4257,58,14,3,6,4,NULL,'single','11:00:00','12:00:00',39),
(4258,58,14,3,6,4,NULL,'single','12:00:00','13:00:00',69),
(4259,58,16,3,6,4,NULL,'single','13:00:00','14:00:00',53);
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
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `timetables`
--

LOCK TABLES `timetables` WRITE;
/*!40000 ALTER TABLE `timetables` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `timetables` VALUES
(42,1,'Spring 2026 - User 130',130,'2026-04-27 01:04:07'),
(51,1,'Spring 2026 - User 132',132,'2026-06-22 19:26:38'),
(58,1,'Spring 2026 - User 1',1,'2026-06-29 18:52:07');
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
) ENGINE=InnoDB AUTO_INCREMENT=471 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
set autocommit=0;
INSERT INTO `users` VALUES
(1,'Admin User','admin@stmu.edu.pk','Admin@123','admin','2026-03-29 16:11:38'),
(3,'Bilal Ahmed','bilal.ahmed@stmu.edu.pk','Teacher@123','teacher','2026-03-29 16:11:38'),
(4,'Sara Iqbal','sara.iqbal@stmu.edu.pk','Teacher@123','teacher','2026-03-29 16:11:38'),
(5,'Hamza Malik','hamza.malik@stmu.edu.pk','Teacher@123','teacher','2026-03-29 16:11:38'),
(6,'Nadia Hussain','nadia.hussain@stmu.edu.pk','Teacher@123','teacher','2026-03-29 16:11:38'),
(8,'Amina Saleem','amina.saleem@stmu.edu.pk','Teacher@123','teacher','2026-03-29 16:11:38'),
(9,'Zain Siddiqui','zain.siddiqui@stmu.edu.pk','Teacher@123','teacher','2026-03-29 16:11:38'),
(101,'Mahnoor Ali','mahnoor.ali@stmu.edu.pk','Student@123','student','2026-03-29 16:11:38'),
(103,'Hira Shah','hira.shah@stmu.edu.pk','Student@123','student','2026-03-29 16:11:38'),
(104,'Ahmed Raza','ahmed.raza@stmu.edu.pk','Student@123','student','2026-03-29 16:11:38'),
(105,'Noor Fatima','noor.fatima@stmu.edu.pk','Student@123','student','2026-03-29 16:11:38'),
(106,'Daniyal Ahsan','daniyal.ahsan@stmu.edu.pk','Student@123','student','2026-03-29 16:11:38'),
(107,'Saba Javed','saba.javed@stmu.edu.pk','Student@123','student','2026-03-29 16:11:38'),
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
(126,'Dr Amir Zaheer','amir.zaheer@stmu.edu.pk','Teacher@123','teacher','2026-03-30 09:30:46'),
(130,'Admin','admin@example.com','admin123','admin','2026-04-19 14:25:58'),
(132,'Abdur Rehman','silentrehman7866@gmail.com','Admin@123','admin','2026-05-19 19:46:15'),
(133,'Abdur Rehman','bsse-22f-0010@stmu.edu.pk','Student@123','student','2026-05-19 20:22:59'),
(134,'Tehzeeb','tehzeeb@stmu.edu.pk','Student@123','student','2026-06-10 15:59:24'),
(135,'Abdul Wahab','abdulwahab@stmu.edu.pk','Student@123','student','2026-06-10 16:00:08'),
(136,'Awais Khan','awaiskhan@stmu.edu.pk','Admin@123','admin','2026-06-22 06:42:54'),
(380,'Ahsan Jamil','ahsan.jamil@stmu.edu.pk','$2b$12$K.wzXbW6e9VbK9T2h7g7eu2h3F1uR3Wb7h8E9r0y1u2i3o4p5a6sD','student','2026-06-22 18:31:27'),
(437,'Mian Rehan','mianrehan@stmu.edu.pk','Student@123','student','2026-06-25 18:33:34'),
(438,'Bilal Sarwar','bilalsarwar@stmu.edu.pk','Student@123','student','2026-06-25 18:34:13'),
(439,'Musfira Hassan','musfirahassan@stmy.edu,pk','Student@123','student','2026-06-25 18:34:54'),
(440,'Zain Shah','zainshah@stmu.edu.pk','Student@123','student','2026-06-25 18:35:27'),
(441,'Safa Risalat','safarisalat@stmu.edu.pk','Student@123','student','2026-06-25 18:35:56'),
(443,'Hashim Fazal','hashimfazal@stmu.edu.pk','Student@123','student','2026-06-25 18:36:37'),
(444,'Tayyaba Samaviya','tayyabasamaviya@stmu.edu.pk','Student@123','student','2026-06-25 18:37:20'),
(445,'Rehan Awan','rehanawan@stmu.edu.pk','Student@123','student','2026-06-25 18:37:55'),
(446,'Ammar Khan','ammarkhan@stmu.edu.pk','Student@123','student','2026-06-25 18:38:20'),
(447,'Roshan Nazir','roshannazir@stmu.edu.pk','Student@123','student','2026-06-25 18:38:45'),
(448,'Zaheer Ahmed','zaheerahmed@stmu.edu.pk','Student@123','student','2026-06-25 18:39:23'),
(449,'Saim ','saim@stmu.edu.pk','Student@123','student','2026-06-25 18:40:02'),
(450,'Ahsan Hanif','ahsanhanif@stmu.edu.pk','Student@123','student','2026-06-25 18:40:35'),
(451,'Dua Muhammad Khan','duamuhammadkhan@stmu.edu.pk','Student@123','student','2026-06-25 18:42:12'),
(452,'Anoosah','anoosah@stmu.edu.pk','Student@123','student','2026-06-25 18:42:47'),
(453,'Younis Dhillo','younisdhillo@stmu.edu.pk','Student@123','student','2026-06-25 18:43:18'),
(454,'Laraib Chaudhary','laraibchaudhary@stmu.edu.pk','Student@123','student','2026-06-25 18:44:59'),
(455,'Shiza Aamir','shizaaamir@stmu.edu.pk','Student@123','student','2026-06-25 18:45:27'),
(456,'Numair Aashir','numairaashir@stmu.edu.pk','Student@123','student','2026-06-25 18:46:04'),
(457,'Zark Khan','zarkkhan@stmu.edu.pk','Student@123','student','2026-06-25 18:46:38'),
(458,'Fasih','fasih@stmu.edu.pk','Student@123','student','2026-06-25 18:47:06'),
(459,'Usman Fazal','usmanfazal@stmu.edu.pk','Student@123','student','2026-06-25 18:48:51'),
(460,'Hamna Nouman','hamnanouman@stmu.edu.pk','Student@123','student','2026-06-25 18:50:44'),
(461,'Madiha Khan','madihakhan@stmu.edu.pk','Student@123','student','2026-06-25 18:53:14'),
(464,'Muneera Khan','muneerakhan@stmu.edu.pk','Student@123','student','2026-06-25 19:04:46'),
(465,'Fatima Naseem','fatimanaseem@stmu.edu.pk','Student@123','student','2026-06-25 19:05:23'),
(466,'Alyan Kiyani','alyankiyani@stmu.edu.pk','Student@123','student','2026-06-25 19:08:07'),
(467,'Ali Imran','aliimran@stmu.edi.pk','Student@123','student','2026-06-25 19:10:17'),
(468,'Alyan Arif','alyanarif@stmu.edi.pk','Student@123','student','2026-06-25 19:11:11'),
(469,'Sohaib Ali Qureshi','sohaibaliqureshi@stmu.edi.pk','Student@123','student','2026-06-25 19:11:51'),
(470,'Ahmad Raza','ahmadraza@example.com','Student@123','student','2026-06-25 19:12:37');
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
(6,'Saturday',0),
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

-- Dump completed on 2026-06-30  0:04:53
