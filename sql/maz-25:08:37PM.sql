-- MySQL dump 10.13  Distrib 8.0.19, for Linux (x86_64)
--
-- Host: 127.0.0.1    Database: speedTrandings
-- ------------------------------------------------------
-- Server version	8.0.19-0ubuntu0.19.10.3

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `currency`
--

DROP TABLE IF EXISTS `currency`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `currency` (
  `id` int NOT NULL,
  `name` varchar(45) NOT NULL,
  `wallet` varchar(45) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `currency`
--

LOCK TABLES `currency` WRITE;
/*!40000 ALTER TABLE `currency` DISABLE KEYS */;
INSERT INTO `currency` VALUES (1,'Bitcoin','3FALsBdWnBLTm6EC5DMyTntZBpAR9AhvmM'),(2,'Ethereum','0x166be843864bcba7235bcb62aa33aa4eadfef4ea');
/*!40000 ALTER TABLE `currency` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `information_user`
--

DROP TABLE IF EXISTS `information_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `information_user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `firstname` varchar(45) DEFAULT NULL,
  `lastname` varchar(45) DEFAULT NULL,
  `email` varchar(45) DEFAULT NULL,
  `phone` varchar(45) DEFAULT NULL,
  `country` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `information_user`
--

LOCK TABLES `information_user` WRITE;
/*!40000 ALTER TABLE `information_user` DISABLE KEYS */;
INSERT INTO `information_user` VALUES (35,'Samuel','Sobalvarro','samuel@gmail.com','+505 83805506','Nicaragua'),(36,'David','Mendoza','david@gmail.com','+505 89562314','Nicaragua'),(37,'Danny','Chavarria','chavarryadanny@gmail.com','+505 78451236','Nicaragua'),(38,'Alyssa','Silva','alyssa@gmail.com','+505 8745124','Nicaragua'),(48,'josue','otero','otero@gmail.com','+505 89562314','Nicaragua'),(49,'Josue','Mayorga','josuemayorga@gmail.com','+505 124578963','Nicaragua'),(50,'juan','ramirez','juan@gmail.com','+505 564578982','Nicaragua');
/*!40000 ALTER TABLE `information_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `investment`
--

DROP TABLE IF EXISTS `investment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `investment` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_currency` int NOT NULL,
  `id_user` int NOT NULL,
  `start_date` datetime NOT NULL,
  `hash` varchar(100) NOT NULL,
  `amount` float NOT NULL,
  `enabled` int NOT NULL,
  `approved` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `investment`
--

LOCK TABLES `investment` WRITE;
/*!40000 ALTER TABLE `investment` DISABLE KEYS */;
INSERT INTO `investment` VALUES (60,2,40,'2020-03-24 18:58:36','asdhaskdlkahsldhalskhd',5,1,0),(61,1,27,'2020-03-24 19:39:26','54sa5d46as546d56a4s6d',0.05,1,0),(62,2,41,'2020-03-24 19:54:28','hash-example-a5s4d54asd654as',10,1,0),(63,1,41,'2020-03-24 19:59:05','hash-example-a5s4d65a4s6d54asd',1,1,0),(64,1,42,'2020-03-24 22:13:56','asdashdhasidhash',0.005,1,0);
/*!40000 ALTER TABLE `investment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `investment_plan`
--

DROP TABLE IF EXISTS `investment_plan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `investment_plan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_currency` int NOT NULL,
  `amount` float NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `investment_plan`
--

LOCK TABLES `investment_plan` WRITE;
/*!40000 ALTER TABLE `investment_plan` DISABLE KEYS */;
INSERT INTO `investment_plan` VALUES (1,1,0.002),(2,1,0.005),(3,1,0.01),(4,1,0.02),(5,1,0.05),(6,1,0.1),(7,1,0.2),(8,1,0.5),(9,1,1),(10,1,2),(11,1,5),(12,1,10),(13,2,0.1),(14,2,0.25),(15,2,0.5),(16,2,1),(17,2,2),(18,2,5),(19,2,10),(20,2,15),(21,2,20),(22,2,30),(23,2,50),(24,2,100);
/*!40000 ALTER TABLE `investment_plan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_investment` int NOT NULL,
  `date` datetime NOT NULL,
  `percentage` float NOT NULL,
  `amount` float NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `request_plan_upgrade`
--

DROP TABLE IF EXISTS `request_plan_upgrade`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `request_plan_upgrade` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_investment` int NOT NULL,
  `amount` float NOT NULL,
  `hash` varchar(100) NOT NULL,
  `approved` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `request_plan_upgrade`
--

LOCK TABLES `request_plan_upgrade` WRITE;
/*!40000 ALTER TABLE `request_plan_upgrade` DISABLE KEYS */;
INSERT INTO `request_plan_upgrade` VALUES (3,63,10,'hash-example-as4d6a5s6a8sd4',0);
/*!40000 ALTER TABLE `request_plan_upgrade` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sponsors`
--

DROP TABLE IF EXISTS `sponsors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sponsors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_referred` int NOT NULL,
  `id_information_user` int NOT NULL,
  `id_currency` int NOT NULL,
  `amount` float NOT NULL,
  `registration_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sponsors`
--

LOCK TABLES `sponsors` WRITE;
/*!40000 ALTER TABLE `sponsors` DISABLE KEYS */;
INSERT INTO `sponsors` VALUES (22,27,48,2,5,'2020-03-24 19:01:49'),(23,27,50,1,0.005,'2020-03-24 22:13:56');
/*!40000 ALTER TABLE `sponsors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_information` int NOT NULL,
  `id_sponsor` int DEFAULT NULL,
  `username` varchar(45) NOT NULL,
  `password` varchar(100) NOT NULL,
  `enabled` int NOT NULL,
  `wallet_btc` varchar(45) NOT NULL,
  `wallet_eth` varchar(45) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (27,35,NULL,'msobalvarro','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',1,'btc-as5d465as4d654sa','eth-as5d46as4d654asd'),(28,36,NULL,'davidmendoza','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',1,'btc-8as4d8as4d64sad6','eth-45asd445as6d5'),(29,37,NULL,'chavarriadanny','15e2b0d3c33891ebb0f1ef609ec419420c20e320ce94c65fbc8c3312448eb225',1,'btc-a5s4d65a4sd654','eth-4as5d4a65s4d'),(30,38,NULL,'alyssa','15e2b0d3c33891ebb0f1ef609ec419420c20e320ce94c65fbc8c3312448eb225',1,'as54d65asd56a4s6d4','54a6s5d46a4s56d5a'),(40,48,22,'oterojosue','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',1,'ajslkdjas;ljd;alsjd;','ashdkjashdjhaskdhjk'),(41,49,NULL,'josuemayorga','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',1,'wallet-btc-as54d5as46as45d','wallet-eth-as54d5as4d6as'),(42,50,23,'juanramirez','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',1,'aklsdlkasjdlkjaslkdj','aksjdlkasjdlksja');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'speedTrandings'
--

--
-- Dumping routines for database 'speedTrandings'
--
/*!50003 DROP PROCEDURE IF EXISTS `createPlan` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `createPlan`(
	in _id_currency int,
	in _id_user int,
    in _hash varchar(100),
    in _amount float
)
BEGIN
	-- Crea un nuevo plan de inversion
	start transaction;
		insert into investment (id_currency, id_user, start_date, hash, amount, enabled)
		values (_id_currency, _id_user, now(), _hash, _amount, 1);       
        
    commit;
    
    SELECT 'success' AS response;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `getDataChart` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `getDataChart`(
	in _user_id int,
    in _currency_id int
)
BEGIN
	-- consulta para extraer datos del dashboard
	set @last_id = (select id from investment
		where id_user = _user_id 
		and id_currency = _currency_id
		and enabled = 1
	);


	select * from payments where id_investment = @last_id;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `getDetails` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `getDetails`(
	in _user_id int,
    in _currency_id int
)
BEGIN
	-- consulta para extraer datos del dashboar
	set @id_user = _user_id;
	set @id_currency = _currency_id;

	-- selecciona el id del registro de inversion
	set @last_id = (select id from investment
		where id_user = @id_user 
		and id_currency = @id_currency
		and enabled = 1
	);

	-- monto total de la inversion
	set @amount_total = (select amount from investment
		where id = @last_id
	);

	-- selecciona la ultima ganancia (dia de hoy)
	set @balance_today = (SELECT amount FROM payments where id_investment = @last_id ORDER BY id DESC LIMIT 1);

	-- selecciona el saldo actual
	set @balance = (SELECT SUM(amount) FROM payments where id_investment = @last_id);


	select start_date, @balance_today as last_pay , (@amount_total * 2) as amount_to_win, ((@amount_total * 2) - @balance) as amount_rest 
	from investment i
	where i.id = @last_id;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `getProfits` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `getProfits`(
	in _user_id int,
    in _currency_id int
)
BEGIN
	-- consulta para extraer datos detalle de retiros/ ganancias totales
	set @id_user = _user_id;
	set @id_currency = _currency_id;

	set @last_id = (select id from investment
		where id_user = @id_user 
		and id_currency = @id_currency
		and enabled = 1
	);

	select * from payments where id_investment = @last_id;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `getRequestDetails` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `getRequestDetails`(
	in _id int
)
BEGIN
	-- Consulta que retorna el detalle de la solicitud
	
    select 
	-- selecciona los datos basico de la persona
	-- que realiza la solicitud de registro

	-- Nombre del solicitante
	CONCAT(infUsr.firstname, ' ' , infUsr.lastname) as name,
	infUsr.email,

	-- Muestra informacion del sponsor si es que la tiene
	-- infSponsor.firstname, 
	invest.hash,
	invest.amount,

	-- info Sponsor
	UsrSpons.username as sponsor_username,
	CONCAT(infSpons.firstname, ' ', infSpons.lastname) as sponsor_name,
    infSpons.email as sponsor_email,
    UsrSpons.wallet_btc as sponsor_wallet_btc,
    UsrSpons.wallet_eth as sponsor_wallet_eth


	from investment invest
	inner join users user on user.id = invest.id_user
	inner join information_user infUsr on infUsr.id = user.id_information

	-- Buscamos el id del sponsor
	inner join sponsors sponsor on sponsor.id = user.id_sponsor
	inner join users UsrSpons on UsrSpons.id = sponsor.id_referred
    inner join information_user infSpons on infSpons.id = UsrSpons.id_information
	where invest.id = _id;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `getTotalPaid` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `getTotalPaid`(
	in _id_user int,
    in _id_currency int
)
BEGIN
	-- consulta para extraer datos del componente HeaderDashboard
	set @last_id = (select id from investment
		where id_user = _id_user 
		and id_currency = _id_currency
		and enabled = 1
	);

	set @amount = (select amount from investment
		where id_user = _id_user
		and id_currency = _id_currency
		and enabled = 1
	);

	-- select @last_id;

	select @last_id as id_investment, @amount as amount, 
    (
		IF (SUM(amount) != null, SUM(amount), 0) 
    ) as total_paid 
    from payments where id_investment = @last_id;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `Login` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `Login`(
	in _email varchar(45),
    in _password varchar(100)
)
BEGIN
	set @id_information = 0;

	select id into @id_information from information_user where email = _email;

	select 
		users.id as id_user, 
        users.username, 
        users.id_information, 
        users.wallet_btc,
        users.wallet_eth,
        
        -- Information  user
        information_user.firstname,
        information_user.lastname,
        information_user.email,
        information_user.phone,
        information_user.country
    from users, information_user
	where users.password = _password
		and users.id_information = @id_information
		and information_user.id = @id_information;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `newUser` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `newUser`(
	-- Data basic for user
	in firstname varchar(45),
    in lastname varchar(45),
    in email varchar(45),
    in phone varchar(45),
    in country varchar(45),
    
    -- sponsor data
    in username_sponsor varchar(45),
    
    -- register plan
    in _id_currency int,
    in _amount float,
	in _hash varchar(100),
    
    -- data register
    in _username varchar(45),
    in _password varchar(100),
    in _wallet_btc varchar (45),
    in _wallet_eth varchar (45)
)
BEGIN
    start transaction;
    -- Insertamos los datos donde estaran los datos basicos del usuario
    insert into information_user (firstname, lastname, email, phone, country)
    values (
        firstname,
        lastname,
        email,
        phone,
        country
    );
    
    -- Guardamos el id del registro del usuario, esto se ocupara para guardarlo en la tabla `users`
    SET @last_id_information_user = LAST_INSERT_ID();
    
    -- insertamos la informacion del usuario sponsor o referido   
    IF username_sponsor != "" then
		-- BUG HEREEEE
        
        set @id_user_sponsor = 0;
        
        Select id into @id_user_sponsor from users where username = username_sponsor;
		
		IF @id_user_sponsor > 0 THEN
			insert into sponsors (`id_referred`, `amount`, `id_currency`, `id_information_user`, `registration_date`)
			values (
				@id_user_sponsor,
				_amount,
                _id_currency,
                @last_id_information_user,
                NOW()
			);
        End if;

        SELECT id FROM users WHERE username = username_sponsor;
    end if;
    
     -- Guardamos el id del registro sponsors
    SET @last_id_sponsors = LAST_INSERT_ID();
    
    insert into users (id_information, id_sponsor, username, password, wallet_btc, wallet_eth, enabled)
    values (
        @last_id_information_user,
        if (username_sponsor != "", @last_id_sponsors, null),
        _username,
        _password,
        _wallet_btc,
        _wallet_eth,
        1
    );
    
     -- Guardamos el id del registro usuario
    SET @last_id_user = LAST_INSERT_ID();
    
    -- Insertamos datos en la tabla donde reflejara la inversion, datos basicos
	insert into investment (id_currency, id_user, start_date, hash, amount, enabled)
    values (
        _id_currency,
        @last_id_user,
        now(),
        _hash,        
        _amount,
        1
    );
    
	SELECT 'success' AS response;
    
    commit;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2020-03-25 20:37:50
