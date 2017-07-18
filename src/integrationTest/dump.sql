-- MySQL dump 10.13  Distrib 5.7.18-14, for osx10.12 (x86_64)
--
-- Host: 127.0.0.1    Database: edm_backend_dev
-- ------------------------------------------------------
-- Server version	5.7.18-15

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
/*!50717 SET @rocksdb_bulk_load_var_name='rocksdb_bulk_load' */;
/*!50717 SELECT COUNT(*) INTO @rocksdb_has_p_s_session_variables FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'performance_schema' AND TABLE_NAME = 'session_variables' */;
/*!50717 SET @rocksdb_get_is_supported = IF (@rocksdb_has_p_s_session_variables, 'SELECT COUNT(*) INTO @rocksdb_is_supported FROM performance_schema.session_variables WHERE VARIABLE_NAME=?', 'SELECT 0') */;
/*!50717 PREPARE s FROM @rocksdb_get_is_supported */;
/*!50717 EXECUTE s USING @rocksdb_bulk_load_var_name */;
/*!50717 DEALLOCATE PREPARE s */;
/*!50717 SET @rocksdb_enable_bulk_load = IF (@rocksdb_is_supported, 'SET SESSION rocksdb_bulk_load = 1', 'SET @rocksdb_dummy_bulk_load = 0') */;
/*!50717 PREPARE s FROM @rocksdb_enable_bulk_load */;
/*!50717 EXECUTE s */;
/*!50717 DEALLOCATE PREPARE s */;

--
-- Table structure for table `clients`
--

DROP TABLE IF EXISTS `clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `clients` (
  `id` binary(16) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `attributes` text,
  `inserted_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clients`
--

LOCK TABLES `clients` WRITE;
/*!40000 ALTER TABLE `clients` DISABLE KEYS */;
INSERT INTO `clients` VALUES ('ÅˆW\‘WM∏8¿Öy_Iæ','grischa',NULL,'2017-05-23 05:35:12','2017-05-23 05:35:12');
/*!40000 ALTER TABLE `clients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `credentials`
--

DROP TABLE IF EXISTS `credentials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `credentials` (
  `id` binary(16) NOT NULL,
  `auth_provider` varchar(255) DEFAULT NULL,
  `remote_id` varchar(255) DEFAULT NULL,
  `extra_data` text,
  `client_id` binary(16) DEFAULT NULL,
  `inserted_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `credentials_auth_provider_remote_id_index` (`auth_provider`,`remote_id`),
  KEY `credentials_client_id_fkey` (`client_id`),
  CONSTRAINT `credentials_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `credentials`
--

LOCK TABLES `credentials` WRITE;
/*!40000 ALTER TABLE `credentials` DISABLE KEYS */;
INSERT INTO `credentials` VALUES ('én\‚ˆ®I˝óW-¡ò5ex','edm_auth','1','{\"token_type\":null,\"token\":\"a40491a5bc5b48ce9cbebf0e890c348c\",\"secret\":null,\"scopes\":[\"\"],\"refresh_token\":\"a464f65f8617473a908503c65d5f6e5d\",\"other\":{},\"expires_at\":1498708680,\"expires\":true}','ÅˆW\‘WM∏8¿Öy_Iæ','2017-05-23 05:35:12','2017-06-29 02:58:01');
/*!40000 ALTER TABLE `credentials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `destinations`
--

DROP TABLE IF EXISTS `destinations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `destinations` (
  `id` binary(16) NOT NULL,
  `base` text,
  `host_id` binary(16) DEFAULT NULL,
  `source_id` binary(16) DEFAULT NULL,
  `inserted_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `destinations_host_id_fkey` (`host_id`),
  KEY `destinations_source_id_fkey` (`source_id`),
  CONSTRAINT `destinations_host_id_fkey` FOREIGN KEY (`host_id`) REFERENCES `hosts` (`id`),
  CONSTRAINT `destinations_source_id_fkey` FOREIGN KEY (`source_id`) REFERENCES `sources` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `destinations`
--

LOCK TABLES `destinations` WRITE;
/*!40000 ALTER TABLE `destinations` DISABLE KEYS */;
INSERT INTO `destinations` VALUES ('@≈∑*”ßCπØèögá.\Íı','/tmp/destination','√∑wìm\'JH°\no\Õ\Ìıı\n','\Î?+RO∞±•?AS\ÃÑ','2017-05-23 08:28:37','2017-05-23 08:28:37');
/*!40000 ALTER TABLE `destinations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `file_transfers`
--

DROP TABLE IF EXISTS `file_transfers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `file_transfers` (
  `id` binary(16) NOT NULL,
  `status` varchar(20) DEFAULT NULL,
  `bytes_transferred` int(11) DEFAULT NULL,
  `file_id` binary(16) DEFAULT NULL,
  `destination_id` binary(16) DEFAULT NULL,
  `inserted_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `file_transfers_destination_id_fkey` (`destination_id`),
  KEY `file_transfers_files_id_fk` (`file_id`),
  CONSTRAINT `file_transfers_destination_id_fkey` FOREIGN KEY (`destination_id`) REFERENCES `destinations` (`id`),
  CONSTRAINT `file_transfers_files_id_fk` FOREIGN KEY (`file_id`) REFERENCES `files` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `file_transfers`
--

LOCK TABLES `file_transfers` WRITE;
/*!40000 ALTER TABLE `file_transfers` DISABLE KEYS */;
/*!40000 ALTER TABLE `file_transfers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `files`
--

DROP TABLE IF EXISTS `files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `files` (
  `id` binary(16) NOT NULL,
  `filepath` text NOT NULL,
  `size` int(11) NOT NULL,
  `mode` int(11) DEFAULT NULL,
  `atime` datetime DEFAULT NULL,
  `mtime` datetime DEFAULT NULL,
  `ctime` datetime DEFAULT NULL,
  `birthtime` datetime DEFAULT NULL,
  `source_id` binary(16) NOT NULL,
  `inserted_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `files_source_id_fkey` (`source_id`),
  CONSTRAINT `files_source_id_fkey` FOREIGN KEY (`source_id`) REFERENCES `sources` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `files`
--

LOCK TABLES `files` WRITE;
/*!40000 ALTER TABLE `files` DISABLE KEYS */;
/*!40000 ALTER TABLE `files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `group_memberships`
--

DROP TABLE IF EXISTS `group_memberships`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `group_memberships` (
  `id` binary(16) NOT NULL,
  `client_id` binary(16) DEFAULT NULL,
  `group_id` binary(16) DEFAULT NULL,
  `inserted_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `group_memberships_client_id_group_id_index` (`client_id`,`group_id`),
  KEY `group_memberships_group_id_fkey` (`group_id`),
  CONSTRAINT `group_memberships_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `group_memberships_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group_memberships`
--

LOCK TABLES `group_memberships` WRITE;
/*!40000 ALTER TABLE `group_memberships` DISABLE KEYS */;
INSERT INTO `group_memberships` VALUES ('™_∏tHT∞Ú[S!>Ωg','ÅˆW\‘WM∏8¿Öy_Iæ','∏∏M\0BùHªµ9vä{| ª','2017-05-23 05:35:12','2017-05-23 05:35:12');
/*!40000 ALTER TABLE `group_memberships` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `groups`
--

DROP TABLE IF EXISTS `groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `groups` (
  `id` binary(16) NOT NULL,
  `name` varchar(50) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `inserted_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `groups_name_index` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `groups`
--

LOCK TABLES `groups` WRITE;
/*!40000 ALTER TABLE `groups` DISABLE KEYS */;
INSERT INTO `groups` VALUES ('∏∏M\0BùHªµ9vä{| ª','grischa','Autogenerated group for user 1181f657-d457-4d06-b838-c085795f49be','2017-05-23 05:35:12','2017-05-23 05:35:12');
/*!40000 ALTER TABLE `groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `guardian_tokens`
--

DROP TABLE IF EXISTS `guardian_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `guardian_tokens` (
  `jti` varchar(255) NOT NULL,
  `typ` varchar(255) DEFAULT NULL,
  `aud` varchar(255) DEFAULT NULL,
  `iss` varchar(255) DEFAULT NULL,
  `sub` varchar(255) DEFAULT NULL,
  `exp` bigint(20) DEFAULT NULL,
  `jwt` text,
  `claims` text,
  `inserted_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`jti`),
  UNIQUE KEY `guardian_tokens_jti_aud_index` (`jti`,`aud`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `guardian_tokens`
--

LOCK TABLES `guardian_tokens` WRITE;
/*!40000 ALTER TABLE `guardian_tokens` DISABLE KEYS */;
INSERT INTO `guardian_tokens` VALUES ('0f3ec820-1c2c-4a30-881e-6e12c3e49a7b','access','Client:1181f657-d457-4d06-b838-c085795f49be','edm-backend','Client:1181f657-d457-4d06-b838-c085795f49be',1501296361,'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJDbGllbnQ6MTE4MWY2NTctZDQ1Ny00ZDA2LWI4MzgtYzA4NTc5NWY0OWJlIiwiZXhwIjoxNTAxMjk2MzYxLCJpYXQiOjE0OTg3MDQzNjEsImlzcyI6ImVkbS1iYWNrZW5kIiwianRpIjoiMGYzZWM4MjAtMWMyYy00YTMwLTg4MWUtNmUxMmMzZTQ5YTdiIiwicGVtIjp7fSwic3ViIjoiQ2xpZW50OjExODFmNjU3LWQ0NTctNGQwNi1iODM4LWMwODU3OTVmNDliZSIsInR5cCI6ImFjY2VzcyJ9.eS3xiIgAOyUGJO1DzkuAqTZOCvLKyDjXWrV8ev76gj1aO2nKA5Zp8VHrePCAIa86xgMMb45C5Yy-NBAGQIQyCw','{\"typ\":\"access\",\"sub\":\"Client:1181f657-d457-4d06-b838-c085795f49be\",\"pem\":{},\"jti\":\"0f3ec820-1c2c-4a30-881e-6e12c3e49a7b\",\"iss\":\"edm-backend\",\"iat\":1498704361,\"exp\":1501296361,\"aud\":\"Client:1181f657-d457-4d06-b838-c085795f49be\"}','2017-06-29 02:46:02','2017-06-29 02:46:02'),('0f60be61-a455-4e21-ab41-be1c8f351fc8','access','Client:1181f657-d457-4d06-b838-c085795f49be','edm-backend','Client:1181f657-d457-4d06-b838-c085795f49be',1501292168,'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJDbGllbnQ6MTE4MWY2NTctZDQ1Ny00ZDA2LWI4MzgtYzA4NTc5NWY0OWJlIiwiZXhwIjoxNTAxMjkyMTY4LCJpYXQiOjE0OTg3MDAxNjgsImlzcyI6ImVkbS1iYWNrZW5kIiwianRpIjoiMGY2MGJlNjEtYTQ1NS00ZTIxLWFiNDEtYmUxYzhmMzUxZmM4IiwicGVtIjp7fSwic3ViIjoiQ2xpZW50OjExODFmNjU3LWQ0NTctNGQwNi1iODM4LWMwODU3OTVmNDliZSIsInR5cCI6ImFjY2VzcyJ9.n_MIVi7MjNwiT0TuOldLjNC_C3pNKcjmzE-48kEH0Yd3r4WrFgLb_el22IHB-lN0SOgKLZtcTcReclDBMhAj3Q','{\"typ\":\"access\",\"sub\":\"Client:1181f657-d457-4d06-b838-c085795f49be\",\"pem\":{},\"jti\":\"0f60be61-a455-4e21-ab41-be1c8f351fc8\",\"iss\":\"edm-backend\",\"iat\":1498700168,\"exp\":1501292168,\"aud\":\"Client:1181f657-d457-4d06-b838-c085795f49be\"}','2017-06-29 01:36:09','2017-06-29 01:36:10'),('1609bbdf-16fc-4e19-95f5-7c0446e4373b','access','Client:1181f657-d457-4d06-b838-c085795f49be','edm-backend','Client:1181f657-d457-4d06-b838-c085795f49be',1501296249,'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJDbGllbnQ6MTE4MWY2NTctZDQ1Ny00ZDA2LWI4MzgtYzA4NTc5NWY0OWJlIiwiZXhwIjoxNTAxMjk2MjQ5LCJpYXQiOjE0OTg3MDQyNDksImlzcyI6ImVkbS1iYWNrZW5kIiwianRpIjoiMTYwOWJiZGYtMTZmYy00ZTE5LTk1ZjUtN2MwNDQ2ZTQzNzNiIiwicGVtIjp7fSwic3ViIjoiQ2xpZW50OjExODFmNjU3LWQ0NTctNGQwNi1iODM4LWMwODU3OTVmNDliZSIsInR5cCI6ImFjY2VzcyJ9.ZwpEBpF1mZMK66cXF3tyDywrzHEuMUAExl5r1RdHaUd9puYP157HAEnQKr_s5DBnl9eMofc29S0BRaDfLfufyw','{\"typ\":\"access\",\"sub\":\"Client:1181f657-d457-4d06-b838-c085795f49be\",\"pem\":{},\"jti\":\"1609bbdf-16fc-4e19-95f5-7c0446e4373b\",\"iss\":\"edm-backend\",\"iat\":1498704249,\"exp\":1501296249,\"aud\":\"Client:1181f657-d457-4d06-b838-c085795f49be\"}','2017-06-29 02:44:09','2017-06-29 02:44:09'),('1770653d-6e09-44c0-81ce-21487b2c2c6f','access','Client:1181f657-d457-4d06-b838-c085795f49be','edm-backend','Client:1181f657-d457-4d06-b838-c085795f49be',1501296249,'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJDbGllbnQ6MTE4MWY2NTctZDQ1Ny00ZDA2LWI4MzgtYzA4NTc5NWY0OWJlIiwiZXhwIjoxNTAxMjk2MjQ5LCJpYXQiOjE0OTg3MDQyNDksImlzcyI6ImVkbS1iYWNrZW5kIiwianRpIjoiMTc3MDY1M2QtNmUwOS00NGMwLTgxY2UtMjE0ODdiMmMyYzZmIiwicGVtIjp7fSwic3ViIjoiQ2xpZW50OjExODFmNjU3LWQ0NTctNGQwNi1iODM4LWMwODU3OTVmNDliZSIsInR5cCI6ImFjY2VzcyJ9.9MjS9JCbo0v3fV7MXhMpep_jM0-3Sh5-V-LNDUWexAXMo3XOZNk91Dp6EOVg7xUGoh7IDxP-46BVVqwn79JogA','{\"typ\":\"access\",\"sub\":\"Client:1181f657-d457-4d06-b838-c085795f49be\",\"pem\":{},\"jti\":\"1770653d-6e09-44c0-81ce-21487b2c2c6f\",\"iss\":\"edm-backend\",\"iat\":1498704249,\"exp\":1501296249,\"aud\":\"Client:1181f657-d457-4d06-b838-c085795f49be\"}','2017-06-29 02:44:09','2017-06-29 02:44:09'),('1bbba28a-5109-4f44-a614-8b5fd1087b63','access','Client:1181f657-d457-4d06-b838-c085795f49be','edm-backend','Client:1181f657-d457-4d06-b838-c085795f49be',1501295644,'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJDbGllbnQ6MTE4MWY2NTctZDQ1Ny00ZDA2LWI4MzgtYzA4NTc5NWY0OWJlIiwiZXhwIjoxNTAxMjk1NjQ0LCJpYXQiOjE0OTg3MDM2NDQsImlzcyI6ImVkbS1iYWNrZW5kIiwianRpIjoiMWJiYmEyOGEtNTEwOS00ZjQ0LWE2MTQtOGI1ZmQxMDg3YjYzIiwicGVtIjp7fSwic3ViIjoiQ2xpZW50OjExODFmNjU3LWQ0NTctNGQwNi1iODM4LWMwODU3OTVmNDliZSIsInR5cCI6ImFjY2VzcyJ9.3lo3bsU5CdWYNz9c2R6TzyrvNlTnfhu_C-7IuXPnYWJE8W_-M4grh7hF_uZSBlzlAS5QLX7PU_jGysZPm06wRA','{\"typ\":\"access\",\"sub\":\"Client:1181f657-d457-4d06-b838-c085795f49be\",\"pem\":{},\"jti\":\"1bbba28a-5109-4f44-a614-8b5fd1087b63\",\"iss\":\"edm-backend\",\"iat\":1498703644,\"exp\":1501295644,\"aud\":\"Client:1181f657-d457-4d06-b838-c085795f49be\"}','2017-06-29 02:34:05','2017-06-29 02:34:05'),('3c2af5ee-f8d0-46a9-af71-4deff7c5a9f7','access','Client:1181f657-d457-4d06-b838-c085795f49be','edm-backend','Client:1181f657-d457-4d06-b838-c085795f49be',1501295784,'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJDbGllbnQ6MTE4MWY2NTctZDQ1Ny00ZDA2LWI4MzgtYzA4NTc5NWY0OWJlIiwiZXhwIjoxNTAxMjk1Nzg0LCJpYXQiOjE0OTg3MDM3ODQsImlzcyI6ImVkbS1iYWNrZW5kIiwianRpIjoiM2MyYWY1ZWUtZjhkMC00NmE5LWFmNzEtNGRlZmY3YzVhOWY3IiwicGVtIjp7fSwic3ViIjoiQ2xpZW50OjExODFmNjU3LWQ0NTctNGQwNi1iODM4LWMwODU3OTVmNDliZSIsInR5cCI6ImFjY2VzcyJ9.zvl3smUahguy1PJ4J-8OjH9Uso2MGABYSTlON_J_8GntlWVHdM4BEmF3pazl2EFMpKjK0o6kRUFwIjEsAyK6DA','{\"typ\":\"access\",\"sub\":\"Client:1181f657-d457-4d06-b838-c085795f49be\",\"pem\":{},\"jti\":\"3c2af5ee-f8d0-46a9-af71-4deff7c5a9f7\",\"iss\":\"edm-backend\",\"iat\":1498703784,\"exp\":1501295784,\"aud\":\"Client:1181f657-d457-4d06-b838-c085795f49be\"}','2017-06-29 02:36:25','2017-06-29 02:36:25'),('3deebea9-8049-4c74-8cca-9fd177e54775','access','Client:1181f657-d457-4d06-b838-c085795f49be','edm-backend','Client:1181f657-d457-4d06-b838-c085795f49be',1501295887,'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJDbGllbnQ6MTE4MWY2NTctZDQ1Ny00ZDA2LWI4MzgtYzA4NTc5NWY0OWJlIiwiZXhwIjoxNTAxMjk1ODg3LCJpYXQiOjE0OTg3MDM4ODcsImlzcyI6ImVkbS1iYWNrZW5kIiwianRpIjoiM2RlZWJlYTktODA0OS00Yzc0LThjY2EtOWZkMTc3ZTU0Nzc1IiwicGVtIjp7fSwic3ViIjoiQ2xpZW50OjExODFmNjU3LWQ0NTctNGQwNi1iODM4LWMwODU3OTVmNDliZSIsInR5cCI6ImFjY2VzcyJ9.-vXnD8rDxl8HFmYhaAVyFWn1qasd8OI2TV_DXPN-EeGNhwjt0WcJrGagQ_0QK8IZ31MWx4Z8_7_8XqJzAVCP2w','{\"typ\":\"access\",\"sub\":\"Client:1181f657-d457-4d06-b838-c085795f49be\",\"pem\":{},\"jti\":\"3deebea9-8049-4c74-8cca-9fd177e54775\",\"iss\":\"edm-backend\",\"iat\":1498703887,\"exp\":1501295887,\"aud\":\"Client:1181f657-d457-4d06-b838-c085795f49be\"}','2017-06-29 02:38:07','2017-06-29 02:38:07'),('3fbd42fe-5b1b-4239-8ce7-98c83142415c','access','Client:1181f657-d457-4d06-b838-c085795f49be','edm-backend','Client:1181f657-d457-4d06-b838-c085795f49be',1501297081,'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJDbGllbnQ6MTE4MWY2NTctZDQ1Ny00ZDA2LWI4MzgtYzA4NTc5NWY0OWJlIiwiZXhwIjoxNTAxMjk3MDgxLCJpYXQiOjE0OTg3MDUwODEsImlzcyI6ImVkbS1iYWNrZW5kIiwianRpIjoiM2ZiZDQyZmUtNWIxYi00MjM5LThjZTctOThjODMxNDI0MTVjIiwicGVtIjp7fSwic3ViIjoiQ2xpZW50OjExODFmNjU3LWQ0NTctNGQwNi1iODM4LWMwODU3OTVmNDliZSIsInR5cCI6ImFjY2VzcyJ9.coebe49H5Y-iEO1TSYDkS-S1m6APD9xXzH5X9erQ4NtxNu-3Byf3ygRNwgyZ74zVdiA6g-OlFp1Zk7SMHL_nbA','{\"typ\":\"access\",\"sub\":\"Client:1181f657-d457-4d06-b838-c085795f49be\",\"pem\":{},\"jti\":\"3fbd42fe-5b1b-4239-8ce7-98c83142415c\",\"iss\":\"edm-backend\",\"iat\":1498705081,\"exp\":1501297081,\"aud\":\"Client:1181f657-d457-4d06-b838-c085795f49be\"}','2017-06-29 02:58:01','2017-06-29 02:58:01'),('3fc4d8fa-563b-4120-a3f5-e1dfed66ea9a','access','Client:1181f657-d457-4d06-b838-c085795f49be','edm-backend','Client:1181f657-d457-4d06-b838-c085795f49be',1501295029,'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJDbGllbnQ6MTE4MWY2NTctZDQ1Ny00ZDA2LWI4MzgtYzA4NTc5NWY0OWJlIiwiZXhwIjoxNTAxMjk1MDI5LCJpYXQiOjE0OTg3MDMwMjksImlzcyI6ImVkbS1iYWNrZW5kIiwianRpIjoiM2ZjNGQ4ZmEtNTYzYi00MTIwLWEzZjUtZTFkZmVkNjZlYTlhIiwicGVtIjp7fSwic3ViIjoiQ2xpZW50OjExODFmNjU3LWQ0NTctNGQwNi1iODM4LWMwODU3OTVmNDliZSIsInR5cCI6ImFjY2VzcyJ9.Lns8EKv5QnaE2Q2X6YlABB1f0llpXs98pEcP_9XilsIQGRbKdX_VbJZGa6H_esLnS4SCQigZcAeLs-z6H56yYg','{\"typ\":\"access\",\"sub\":\"Client:1181f657-d457-4d06-b838-c085795f49be\",\"pem\":{},\"jti\":\"3fc4d8fa-563b-4120-a3f5-e1dfed66ea9a\",\"iss\":\"edm-backend\",\"iat\":1498703029,\"exp\":1501295029,\"aud\":\"Client:1181f657-d457-4d06-b838-c085795f49be\"}','2017-06-29 02:23:50','2017-06-29 02:23:50'),('4b64a9a0-3569-45c5-be36-30ed638cb6e8','access','Client:1181f657-d457-4d06-b838-c085795f49be','edm-backend','Client:1181f657-d457-4d06-b838-c085795f49be',1501295029,'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJDbGllbnQ6MTE4MWY2NTctZDQ1Ny00ZDA2LWI4MzgtYzA4NTc5NWY0OWJlIiwiZXhwIjoxNTAxMjk1MDI5LCJpYXQiOjE0OTg3MDMwMjksImlzcyI6ImVkbS1iYWNrZW5kIiwianRpIjoiNGI2NGE5YTAtMzU2OS00NWM1LWJlMzYtMzBlZDYzOGNiNmU4IiwicGVtIjp7fSwic3ViIjoiQ2xpZW50OjExODFmNjU3LWQ0NTctNGQwNi1iODM4LWMwODU3OTVmNDliZSIsInR5cCI6ImFjY2VzcyJ9.3V4cMqrlAFlleuBXLlFGYJYM_k1M4H_AuVsqWH63j4b0yjbEdpJ_OvrcXnMdgXd4RIPuOQ34zRMlA1Vgn2Z3vw','{\"typ\":\"access\",\"sub\":\"Client:1181f657-d457-4d06-b838-c085795f49be\",\"pem\":{},\"jti\":\"4b64a9a0-3569-45c5-be36-30ed638cb6e8\",\"iss\":\"edm-backend\",\"iat\":1498703029,\"exp\":1501295029,\"aud\":\"Client:1181f657-d457-4d06-b838-c085795f49be\"}','2017-06-29 02:23:49','2017-06-29 02:23:49'),('4beded1e-77b8-4f6a-9164-4b5ce38b6d8a','access','Client:1181f657-d457-4d06-b838-c085795f49be','edm-backend','Client:1181f657-d457-4d06-b838-c085795f49be',1501295644,'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJDbGllbnQ6MTE4MWY2NTctZDQ1Ny00ZDA2LWI4MzgtYzA4NTc5NWY0OWJlIiwiZXhwIjoxNTAxMjk1NjQ0LCJpYXQiOjE0OTg3MDM2NDQsImlzcyI6ImVkbS1iYWNrZW5kIiwianRpIjoiNGJlZGVkMWUtNzdiOC00ZjZhLTkxNjQtNGI1Y2UzOGI2ZDhhIiwicGVtIjp7fSwic3ViIjoiQ2xpZW50OjExODFmNjU3LWQ0NTctNGQwNi1iODM4LWMwODU3OTVmNDliZSIsInR5cCI6ImFjY2VzcyJ9.yuqw2ahH3AfOeMcSLHJNJbSmx6Xn_XGa9jb0DHFFqVCOwzlH7zcAhILCDDgdV1rmjR44hTmBRyMknhD_IqK06w','{\"typ\":\"access\",\"sub\":\"Client:1181f657-d457-4d06-b838-c085795f49be\",\"pem\":{},\"jti\":\"4beded1e-77b8-4f6a-9164-4b5ce38b6d8a\",\"iss\":\"edm-backend\",\"iat\":1498703644,\"exp\":1501295644,\"aud\":\"Client:1181f657-d457-4d06-b838-c085795f49be\"}','2017-06-29 02:34:05','2017-06-29 02:34:05'),('4c7e1d1c-bc9e-49db-962c-8b02775ee6cb','access','Client:1181f657-d457-4d06-b838-c085795f49be','edm-backend','Client:1181f657-d457-4d06-b838-c085795f49be',1501295585,'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJDbGllbnQ6MTE4MWY2NTctZDQ1Ny00ZDA2LWI4MzgtYzA4NTc5NWY0OWJlIiwiZXhwIjoxNTAxMjk1NTg1LCJpYXQiOjE0OTg3MDM1ODUsImlzcyI6ImVkbS1iYWNrZW5kIiwianRpIjoiNGM3ZTFkMWMtYmM5ZS00OWRiLTk2MmMtOGIwMjc3NWVlNmNiIiwicGVtIjp7fSwic3ViIjoiQ2xpZW50OjExODFmNjU3LWQ0NTctNGQwNi1iODM4LWMwODU3OTVmNDliZSIsInR5cCI6ImFjY2VzcyJ9.D-uqUaJy9H-svjHV-0Ct-x8eWx7T1PXj2It4yEiZTSHOcSp8venkJxOpM72k7AnIVw48jV3U6PaP9jcq4Nh_6A','{\"typ\":\"access\",\"sub\":\"Client:1181f657-d457-4d06-b838-c085795f49be\",\"pem\":{},\"jti\":\"4c7e1d1c-bc9e-49db-962c-8b02775ee6cb\",\"iss\":\"edm-backend\",\"iat\":1498703585,\"exp\":1501295585,\"aud\":\"Client:1181f657-d457-4d06-b838-c085795f49be\"}','2017-06-29 02:33:05','2017-06-29 02:33:05'),('4cf98487-7a23-40ad-a1d9-6e262b486027','access','Client:1181f657-d457-4d06-b838-c085795f49be','edm-backend','Client:1181f657-d457-4d06-b838-c085795f49be',1501295136,'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJDbGllbnQ6MTE4MWY2NTctZDQ1Ny00ZDA2LWI4MzgtYzA4NTc5NWY0OWJlIiwiZXhwIjoxNTAxMjk1MTM2LCJpYXQiOjE0OTg3MDMxMzYsImlzcyI6ImVkbS1iYWNrZW5kIiwianRpIjoiNGNmOTg0ODctN2EyMy00MGFkLWExZDktNmUyNjJiNDg2MDI3IiwicGVtIjp7fSwic3ViIjoiQ2xpZW50OjExODFmNjU3LWQ0NTctNGQwNi1iODM4LWMwODU3OTVmNDliZSIsInR5cCI6ImFjY2VzcyJ9.bVfUNM9lgT8U1knFPJHe6WdzF-P0tJGtHYU0n1N4GY8hsflI2E9Du0bY4XUxR7ckzBUOAxokEjA0EkLsgy_C-g','{\"typ\":\"access\",\"sub\":\"Client:1181f657-d457-4d06-b838-c085795f49be\",\"pem\":{},\"jti\":\"4cf98487-7a23-40ad-a1d9-6e262b486027\",\"iss\":\"edm-backend\",\"iat\":1498703136,\"exp\":1501295136,\"aud\":\"Client:1181f657-d457-4d06-b838-c085795f49be\"}','2017-06-29 02:25:36','2017-06-29 02:25:36'),('64013601-f3aa-440a-8477-521d6d8abc9f','access','Client:1181f657-d457-4d06-b838-c085795f49be','edm-backend','Client:1181f657-d457-4d06-b838-c085795f49be',1501295887,'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJDbGllbnQ6MTE4MWY2NTctZDQ1Ny00ZDA2LWI4MzgtYzA4NTc5NWY0OWJlIiwiZXhwIjoxNTAxMjk1ODg3LCJpYXQiOjE0OTg3MDM4ODcsImlzcyI6ImVkbS1iYWNrZW5kIiwianRpIjoiNjQwMTM2MDEtZjNhYS00NDBhLTg0NzctNTIxZDZkOGFiYzlmIiwicGVtIjp7fSwic3ViIjoiQ2xpZW50OjExODFmNjU3LWQ0NTctNGQwNi1iODM4LWMwODU3OTVmNDliZSIsInR5cCI6ImFjY2VzcyJ9.u7R67-smOEYLe95avRqXQN2N4nacZaLnIAn0HQ-W_nGJgB2OchXJlHF-dOSpM1qY3EPL0PQl3fB255-fMfZ_Vw','{\"typ\":\"access\",\"sub\":\"Client:1181f657-d457-4d06-b838-c085795f49be\",\"pem\":{},\"jti\":\"64013601-f3aa-440a-8477-521d6d8abc9f\",\"iss\":\"edm-backend\",\"iat\":1498703887,\"exp\":1501295887,\"aud\":\"Client:1181f657-d457-4d06-b838-c085795f49be\"}','2017-06-29 02:38:08','2017-06-29 02:38:08'),('7159ef3e-60df-4d3f-ae1b-fc71e4cb24c8','access','Client:1181f657-d457-4d06-b838-c085795f49be','edm-backend','Client:1181f657-d457-4d06-b838-c085795f49be',1501297081,'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJDbGllbnQ6MTE4MWY2NTctZDQ1Ny00ZDA2LWI4MzgtYzA4NTc5NWY0OWJlIiwiZXhwIjoxNTAxMjk3MDgxLCJpYXQiOjE0OTg3MDUwODEsImlzcyI6ImVkbS1iYWNrZW5kIiwianRpIjoiNzE1OWVmM2UtNjBkZi00ZDNmLWFlMWItZmM3MWU0Y2IyNGM4IiwicGVtIjp7fSwic3ViIjoiQ2xpZW50OjExODFmNjU3LWQ0NTctNGQwNi1iODM4LWMwODU3OTVmNDliZSIsInR5cCI6ImFjY2VzcyJ9.hdAq0MXr6cofr5xKg4KByHOSi-ZvrvqPqJfSKaRShbKEHZjrf9QwzeyexDTVOgSng-guDvoH-XpLIgCW_1r-vQ','{\"typ\":\"access\",\"sub\":\"Client:1181f657-d457-4d06-b838-c085795f49be\",\"pem\":{},\"jti\":\"7159ef3e-60df-4d3f-ae1b-fc71e4cb24c8\",\"iss\":\"edm-backend\",\"iat\":1498705081,\"exp\":1501297081,\"aud\":\"Client:1181f657-d457-4d06-b838-c085795f49be\"}','2017-06-29 02:58:01','2017-06-29 02:58:01'),('72cb9c2e-bb70-44b5-8c20-aeb0f2fd1734','access','Client:1181f657-d457-4d06-b838-c085795f49be','edm-backend','Client:1181f657-d457-4d06-b838-c085795f49be',1501292651,'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJDbGllbnQ6MTE4MWY2NTctZDQ1Ny00ZDA2LWI4MzgtYzA4NTc5NWY0OWJlIiwiZXhwIjoxNTAxMjkyNjUxLCJpYXQiOjE0OTg3MDA2NTEsImlzcyI6ImVkbS1iYWNrZW5kIiwianRpIjoiNzJjYjljMmUtYmI3MC00NGI1LThjMjAtYWViMGYyZmQxNzM0IiwicGVtIjp7fSwic3ViIjoiQ2xpZW50OjExODFmNjU3LWQ0NTctNGQwNi1iODM4LWMwODU3OTVmNDliZSIsInR5cCI6ImFjY2VzcyJ9.NdUd9WRPXkoG_3XNhgvZcgEU6xendhUAoEu6ah0jIlvQGCwIai8OeC2XKLYSt5AX5BtPjOZd17w3-8Jie-tPIQ','{\"typ\":\"access\",\"sub\":\"Client:1181f657-d457-4d06-b838-c085795f49be\",\"pem\":{},\"jti\":\"72cb9c2e-bb70-44b5-8c20-aeb0f2fd1734\",\"iss\":\"edm-backend\",\"iat\":1498700651,\"exp\":1501292651,\"aud\":\"Client:1181f657-d457-4d06-b838-c085795f49be\"}','2017-06-29 01:44:12','2017-06-29 01:44:12'),('74bdce16-da55-45b3-94d0-f11c84f4769f','access','Client:1181f657-d457-4d06-b838-c085795f49be','edm-backend','Client:1181f657-d457-4d06-b838-c085795f49be',1501295136,'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJDbGllbnQ6MTE4MWY2NTctZDQ1Ny00ZDA2LWI4MzgtYzA4NTc5NWY0OWJlIiwiZXhwIjoxNTAxMjk1MTM2LCJpYXQiOjE0OTg3MDMxMzYsImlzcyI6ImVkbS1iYWNrZW5kIiwianRpIjoiNzRiZGNlMTYtZGE1NS00NWIzLTk0ZDAtZjExYzg0ZjQ3NjlmIiwicGVtIjp7fSwic3ViIjoiQ2xpZW50OjExODFmNjU3LWQ0NTctNGQwNi1iODM4LWMwODU3OTVmNDliZSIsInR5cCI6ImFjY2VzcyJ9.IHoaFKjvi16SGpcUxye3d40dy-w0tZeHaGnGGxQOtFVJzDuA2d6fB5N0SBwbFda977kBUasvhWf79W5KD-FSDw','{\"typ\":\"access\",\"sub\":\"Client:1181f657-d457-4d06-b838-c085795f49be\",\"pem\":{},\"jti\":\"74bdce16-da55-45b3-94d0-f11c84f4769f\",\"iss\":\"edm-backend\",\"iat\":1498703136,\"exp\":1501295136,\"aud\":\"Client:1181f657-d457-4d06-b838-c085795f49be\"}','2017-06-29 02:25:36','2017-06-29 02:25:36'),('8d55e499-95fc-4533-9b51-abe153a8958f','access','Client:1181f657-d457-4d06-b838-c085795f49be','edm-backend','Client:1181f657-d457-4d06-b838-c085795f49be',1501295832,'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJDbGllbnQ6MTE4MWY2NTctZDQ1Ny00ZDA2LWI4MzgtYzA4NTc5NWY0OWJlIiwiZXhwIjoxNTAxMjk1ODMyLCJpYXQiOjE0OTg3MDM4MzIsImlzcyI6ImVkbS1iYWNrZW5kIiwianRpIjoiOGQ1NWU0OTktOTVmYy00NTMzLTliNTEtYWJlMTUzYTg5NThmIiwicGVtIjp7fSwic3ViIjoiQ2xpZW50OjExODFmNjU3LWQ0NTctNGQwNi1iODM4LWMwODU3OTVmNDliZSIsInR5cCI6ImFjY2VzcyJ9.lFYxlnKX4-Pdc7sJE8nMbMCmt5d-2M8CcbSL8dkocLgbXZ5xSh9SBL25EJhgXJ7hq8Y-OVAnIbH8Pd2Zk8usXg','{\"typ\":\"access\",\"sub\":\"Client:1181f657-d457-4d06-b838-c085795f49be\",\"pem\":{},\"jti\":\"8d55e499-95fc-4533-9b51-abe153a8958f\",\"iss\":\"edm-backend\",\"iat\":1498703832,\"exp\":1501295832,\"aud\":\"Client:1181f657-d457-4d06-b838-c085795f49be\"}','2017-06-29 02:37:12','2017-06-29 02:37:12'),('cdd842d7-2dd2-4e28-8f43-96edde972962','access','Client:1181f657-d457-4d06-b838-c085795f49be','edm-backend','Client:1181f657-d457-4d06-b838-c085795f49be',1501296361,'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJDbGllbnQ6MTE4MWY2NTctZDQ1Ny00ZDA2LWI4MzgtYzA4NTc5NWY0OWJlIiwiZXhwIjoxNTAxMjk2MzYxLCJpYXQiOjE0OTg3MDQzNjEsImlzcyI6ImVkbS1iYWNrZW5kIiwianRpIjoiY2RkODQyZDctMmRkMi00ZTI4LThmNDMtOTZlZGRlOTcyOTYyIiwicGVtIjp7fSwic3ViIjoiQ2xpZW50OjExODFmNjU3LWQ0NTctNGQwNi1iODM4LWMwODU3OTVmNDliZSIsInR5cCI6ImFjY2VzcyJ9.HcZipCtDsHTVhjn-sSU-3p5ppAOfXsB3f2NLcfBeAJbhvJk2e3qmYTxOcN-KMcg5dqE8YgnY1xvTli4lsveCDA','{\"typ\":\"access\",\"sub\":\"Client:1181f657-d457-4d06-b838-c085795f49be\",\"pem\":{},\"jti\":\"cdd842d7-2dd2-4e28-8f43-96edde972962\",\"iss\":\"edm-backend\",\"iat\":1498704361,\"exp\":1501296361,\"aud\":\"Client:1181f657-d457-4d06-b838-c085795f49be\"}','2017-06-29 02:46:02','2017-06-29 02:46:02'),('e8c9171d-1891-42e5-9d7c-1b4e510d1c14','access','Client:1181f657-d457-4d06-b838-c085795f49be','edm-backend','Client:1181f657-d457-4d06-b838-c085795f49be',1501292651,'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJDbGllbnQ6MTE4MWY2NTctZDQ1Ny00ZDA2LWI4MzgtYzA4NTc5NWY0OWJlIiwiZXhwIjoxNTAxMjkyNjUxLCJpYXQiOjE0OTg3MDA2NTEsImlzcyI6ImVkbS1iYWNrZW5kIiwianRpIjoiZThjOTE3MWQtMTg5MS00MmU1LTlkN2MtMWI0ZTUxMGQxYzE0IiwicGVtIjp7fSwic3ViIjoiQ2xpZW50OjExODFmNjU3LWQ0NTctNGQwNi1iODM4LWMwODU3OTVmNDliZSIsInR5cCI6ImFjY2VzcyJ9.55EWosuz167God0UO5PvYvGQsLIDFPcuqB8cBJ4a0ycyzOu40cylGy1-pPBL5b0__L1db_qvHy6a4-fEjH7Rsw','{\"typ\":\"access\",\"sub\":\"Client:1181f657-d457-4d06-b838-c085795f49be\",\"pem\":{},\"jti\":\"e8c9171d-1891-42e5-9d7c-1b4e510d1c14\",\"iss\":\"edm-backend\",\"iat\":1498700651,\"exp\":1501292651,\"aud\":\"Client:1181f657-d457-4d06-b838-c085795f49be\"}','2017-06-29 01:44:12','2017-06-29 01:44:12'),('e9bbd55a-1595-446d-b83a-12fb6205dffb','access','Client:1181f657-d457-4d06-b838-c085795f49be','edm-backend','Client:1181f657-d457-4d06-b838-c085795f49be',1501295743,'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJDbGllbnQ6MTE4MWY2NTctZDQ1Ny00ZDA2LWI4MzgtYzA4NTc5NWY0OWJlIiwiZXhwIjoxNTAxMjk1NzQzLCJpYXQiOjE0OTg3MDM3NDMsImlzcyI6ImVkbS1iYWNrZW5kIiwianRpIjoiZTliYmQ1NWEtMTU5NS00NDZkLWI4M2EtMTJmYjYyMDVkZmZiIiwicGVtIjp7fSwic3ViIjoiQ2xpZW50OjExODFmNjU3LWQ0NTctNGQwNi1iODM4LWMwODU3OTVmNDliZSIsInR5cCI6ImFjY2VzcyJ9.ZXNYlyPD-c409TZawJE3kqlXCGPSuL3YTW98jQO0ajJFheQ7j0yC4J4KxJia-z8QFI0UFRjjX88_o-jn-g_SRw','{\"typ\":\"access\",\"sub\":\"Client:1181f657-d457-4d06-b838-c085795f49be\",\"pem\":{},\"jti\":\"e9bbd55a-1595-446d-b83a-12fb6205dffb\",\"iss\":\"edm-backend\",\"iat\":1498703743,\"exp\":1501295743,\"aud\":\"Client:1181f657-d457-4d06-b838-c085795f49be\"}','2017-06-29 02:35:44','2017-06-29 02:35:44'),('ea635ecc-894a-442c-9258-ec968d7bc60a','access','Client:1181f657-d457-4d06-b838-c085795f49be','edm-backend','Client:1181f657-d457-4d06-b838-c085795f49be',1501295784,'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJDbGllbnQ6MTE4MWY2NTctZDQ1Ny00ZDA2LWI4MzgtYzA4NTc5NWY0OWJlIiwiZXhwIjoxNTAxMjk1Nzg0LCJpYXQiOjE0OTg3MDM3ODQsImlzcyI6ImVkbS1iYWNrZW5kIiwianRpIjoiZWE2MzVlY2MtODk0YS00NDJjLTkyNTgtZWM5NjhkN2JjNjBhIiwicGVtIjp7fSwic3ViIjoiQ2xpZW50OjExODFmNjU3LWQ0NTctNGQwNi1iODM4LWMwODU3OTVmNDliZSIsInR5cCI6ImFjY2VzcyJ9.7QIz2cPJ0g4ER1u8nohuZzi63hDc_PM_zUYKPLLFYhuVZibVpe0GYlkkKFq354SkBKZ2dal7In2ekD3v6H5Hzw','{\"typ\":\"access\",\"sub\":\"Client:1181f657-d457-4d06-b838-c085795f49be\",\"pem\":{},\"jti\":\"ea635ecc-894a-442c-9258-ec968d7bc60a\",\"iss\":\"edm-backend\",\"iat\":1498703784,\"exp\":1501295784,\"aud\":\"Client:1181f657-d457-4d06-b838-c085795f49be\"}','2017-06-29 02:36:25','2017-06-29 02:36:25');
/*!40000 ALTER TABLE `guardian_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hosts`
--

DROP TABLE IF EXISTS `hosts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `hosts` (
  `id` binary(16) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `transfer_method` varchar(30) DEFAULT NULL,
  `settings` text,
  `group_id` binary(16) DEFAULT NULL,
  `inserted_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `hosts_group_id_name_index` (`group_id`,`name`),
  CONSTRAINT `hosts_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hosts`
--

LOCK TABLES `hosts` WRITE;
/*!40000 ALTER TABLE `hosts` DISABLE KEYS */;
INSERT INTO `hosts` VALUES ('√∑wìm\'JH°\no\Õ\Ìıı\n','demo destination','local','{}','∏∏M\0BùHªµ9vä{| ª','2017-05-23 08:26:21','2017-05-23 08:26:21');
/*!40000 ALTER TABLE `hosts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roles` (
  `id` binary(16) NOT NULL,
  `name` varchar(20) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `type` varchar(20) DEFAULT NULL,
  `source_group_id` binary(16) DEFAULT NULL,
  `target_group_id` binary(16) DEFAULT NULL,
  `inserted_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_type_source_group_id_target_group_id_index` (`type`,`source_group_id`,`target_group_id`),
  KEY `roles_source_group_id_fkey` (`source_group_id`),
  KEY `roles_target_group_id_fkey` (`target_group_id`),
  CONSTRAINT `roles_source_group_id_fkey` FOREIGN KEY (`source_group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
  CONSTRAINT `roles_target_group_id_fkey` FOREIGN KEY (`target_group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES ('#ÆˇbãCΩîM9ì∂4','admin',NULL,'admin','∏∏M\0BùHªµ9vä{| ª','∏∏M\0BùHªµ9vä{| ª','2017-05-23 23:45:47','2017-05-23 23:45:47');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `schema_migrations`
--

DROP TABLE IF EXISTS `schema_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `schema_migrations` (
  `version` bigint(20) NOT NULL,
  `inserted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schema_migrations`
--

LOCK TABLES `schema_migrations` WRITE;
/*!40000 ALTER TABLE `schema_migrations` DISABLE KEYS */;
INSERT INTO `schema_migrations` VALUES (20160610021947,'2017-02-05 21:59:41'),(20160811021723,'2017-02-05 21:59:41'),(20160811040400,'2017-02-05 21:59:41'),(20160811040448,'2017-02-05 21:59:41'),(20160817034453,'2017-02-05 21:59:41'),(20160913071655,'2017-02-05 21:59:41'),(20161028045300,'2017-02-05 21:59:41'),(20161028045326,'2017-02-05 21:59:41'),(20161028045340,'2017-02-05 21:59:41'),(20161028045343,'2017-02-05 21:59:41'),(20161028045351,'2017-02-05 21:59:41'),(20170116044959,'2017-02-05 21:59:41');
/*!40000 ALTER TABLE `schema_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sources`
--

DROP TABLE IF EXISTS `sources`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sources` (
  `id` binary(16) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `fstype` varchar(20) DEFAULT NULL,
  `settings` text,
  `owner_id` binary(16) DEFAULT NULL,
  `inserted_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sources_owner_id_name_index` (`owner_id`,`name`),
  CONSTRAINT `sources_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `clients` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sources`
--

LOCK TABLES `sources` WRITE;
/*!40000 ALTER TABLE `sources` DISABLE KEYS */;
INSERT INTO `sources` VALUES ('\Î?+RO∞±•?AS\ÃÑ','demo source','POSIX','{\"cron_time\":\"* * * * *\",\"check_method\":\"cron\",\"basepath\":\"/tmp/source\"}','ÅˆW\‘WM∏8¿Öy_Iæ','2017-05-23 08:18:35','2017-05-23 08:18:35');
/*!40000 ALTER TABLE `sources` ENABLE KEYS */;
UNLOCK TABLES;
/*!50112 SET @disable_bulk_load = IF (@is_rocksdb_supported, 'SET SESSION rocksdb_bulk_load = @old_rocksdb_bulk_load', 'SET @dummy_rocksdb_bulk_load = 0') */;
/*!50112 PREPARE s FROM @disable_bulk_load */;
/*!50112 EXECUTE s */;
/*!50112 DEALLOCATE PREPARE s */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2017-07-10 16:36:49
