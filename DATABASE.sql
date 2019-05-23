-- phpMyAdmin SQL Dump
-- version 4.8.5
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: May 12, 2019 at 08:16 PM
-- Server version: 10.1.38-MariaDB
-- PHP Version: 7.3.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `bacancy`
--

-- --------------------------------------------------------

--
-- Table structure for table `userAddress`
--

CREATE TABLE `userAddress` (
  `userAddressId` bigint(20) NOT NULL,
  `userId` bigint(20) NOT NULL,
  `userAddress` text COLLATE utf8_bin NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

--
-- Dumping data for table `userAddress`
--

INSERT INTO `userAddress` (`userAddressId`, `userId`, `userAddress`, `createdAt`, `updatedAt`) VALUES
(1, 1, 'My Address', '2019-05-12 17:41:34', '2019-05-12 17:43:03');

-- --------------------------------------------------------

--
-- Table structure for table `userMaster`
--

CREATE TABLE `userMaster` (
  `userId` bigint(20) NOT NULL,
  `userName` varchar(255) COLLATE utf8_bin NOT NULL,
  `userEmail` varchar(255) COLLATE utf8_bin NOT NULL,
  `userPassword` text COLLATE utf8_bin NOT NULL,
  `userCreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `userUpdatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

--
-- Dumping data for table `userMaster`
--

INSERT INTO `userMaster` (`userId`, `userName`, `userEmail`, `userPassword`, `userCreatedAt`, `userUpdatedAt`) VALUES
(1, 'Admin', 'admin@example.com', '$2b$10$B8ebcJ1TMZUP7neUQh4A5eALOES/LzS9JPo12Tc.XjYzj4M1/0/qq', '2019-05-12 17:31:14', '2019-05-12 17:31:14');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `userAddress`
--
ALTER TABLE `userAddress`
  ADD PRIMARY KEY (`userAddressId`),
  ADD KEY `userId` (`userId`);

--
-- Indexes for table `userMaster`
--
ALTER TABLE `userMaster`
  ADD PRIMARY KEY (`userId`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `userAddress`
--
ALTER TABLE `userAddress`
  MODIFY `userAddressId` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `userMaster`
--
ALTER TABLE `userMaster`
  MODIFY `userId` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `userAddress`
--
ALTER TABLE `userAddress`
  ADD CONSTRAINT `UserAddressToUserId` FOREIGN KEY (`userId`) REFERENCES `userMaster` (`userId`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
