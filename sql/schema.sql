-- ========================
-- SCHEMA
-- ========================
DROP TABLE IF EXISTS commande_ligne;
DROP TABLE IF EXISTS commandes;
DROP TABLE IF EXISTS produits;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS admins;

CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE clients (
  id INT PRIMARY KEY,
  nom VARCHAR(80) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  vip TINYINT(1) NOT NULL DEFAULT 0
);

CREATE TABLE produits (
  id INT PRIMARY KEY,
  titre VARCHAR(120) NOT NULL,
  categorie VARCHAR(50) NOT NULL,
  prix DECIMAL(8,2) NOT NULL,
  stock INT NOT NULL
);

CREATE TABLE commandes (
  id INT PRIMARY KEY,
  client_id INT NOT NULL,
  date_commande DATE NOT NULL,
  statut VARCHAR(20) NOT NULL,      -- ex: pending, paid, shipped, cancelled
  mode_paiement VARCHAR(20) NOT NULL, -- ex: card, bank, crypto
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE TABLE commande_ligne (
  id INT PRIMARY KEY,
  commande_id INT NOT NULL,
  produit_id INT NOT NULL,
  quantite INT NOT NULL,
  prix_unitaire DECIMAL(8,2) NOT NULL,
  FOREIGN KEY (commande_id) REFERENCES commandes(id),
  FOREIGN KEY (produit_id) REFERENCES produits(id)
);

-- ========================
-- DONNÉES
-- ========================
INSERT INTO clients (id, nom, email, vip) VALUES
(1,'Alice','alice@example.com',1),
(2,'Bob','bob@example.com',0),
(3,'Chloé','chloe@example.com',1),
(4,'David','david@example.com',0),
(5,'Emma','emma@example.com',0),
(6,'Farid','farid@example.com',1),
(7,'Gaël','gael@example.com',0),
(8,'Hana','hana@example.com',0);

INSERT INTO produits (id, titre, categorie, prix, stock) VALUES
(101,'SQL pour les nuls','Informatique',24.90,50),
(102,'Maîtriser MySQL','Informatique',39.00,30),
(103,'Python avancé','Informatique',45.00,25),
(104,'Graphes et Algorithmes','Informatique',55.00,15),
(105,'Marketing Digital','Business',29.00,40),
(106,'Finance d’entreprise','Business',49.00,20),
(107,'Roman Noir','Littérature',19.00,60),
(108,'Poèmes Modernes','Littérature',15.00,80),
(109,'Bandes dessinées T1','Littérature',12.00,100),
(110,'Mindfulness & Bien-être','Lifestyle',22.00,35);

INSERT INTO commandes (id, client_id, date_commande, statut, mode_paiement) VALUES
(1001,1,'2025-09-01','paid','card'),
(1002,1,'2025-09-10','shipped','card'),
(1003,2,'2025-09-05','cancelled','bank'),
(1004,2,'2025-09-12','paid','crypto'),
(1005,3,'2025-09-15','paid','card'),
(1006,3,'2025-09-20','pending','bank'),
(1007,4,'2025-09-03','paid','card'),
(1008,5,'2025-09-07','paid','card'),
(1009,5,'2025-09-21','shipped','bank'),
(1010,6,'2025-09-02','paid','crypto'),
(1011,6,'2025-09-18','paid','card'),
(1012,7,'2025-09-04','cancelled','card'),
(1013,7,'2025-09-22','paid','card'),
(1014,8,'2025-09-11','paid','bank'),
(1015,8,'2025-09-19','paid','card');

-- NB: prix_unitaire “fige” le prix payé (en cas de promo) au moment de la commande
INSERT INTO commande_ligne (id, commande_id, produit_id, quantite, prix_unitaire) VALUES
-- cmd 1001 (Alice)
(1,1001,101,1,24.90),
(2,1001,107,2,19.00),
-- cmd 1002 (Alice)
(3,1002,102,1,39.00),
(4,1002,109,3,12.00),
-- cmd 1003 (Bob - annulée)
(5,1003,108,1,15.00),
-- cmd 1004 (Bob)
(6,1004,101,2,24.90),
(7,1004,110,1,22.00),
-- cmd 1005 (Chloé)
(8,1005,103,1,45.00),
(9,1005,104,1,55.00),
-- cmd 1006 (Chloé - pending)
(10,1006,105,1,29.00),
-- cmd 1007 (David)
(11,1007,107,1,19.00),
(12,1007,109,1,12.00),
-- cmd 1008 (Emma)
(13,1008,110,2,22.00),
(14,1008,105,1,29.00),
-- cmd 1009 (Emma)
(15,1009,101,1,24.90),
(16,1009,102,1,39.00),
(17,1009,109,4,12.00),
-- cmd 1010 (Farid)
(18,1010,103,1,45.00),
(19,1010,101,1,24.90),
-- cmd 1011 (Farid)
(20,1011,106,1,49.00),
(21,1011,110,1,22.00),
-- cmd 1012 (Gaël - annulée)
(22,1012,107,1,19.00),
-- cmd 1013 (Gaël)
(23,1013,102,1,39.00),
(24,1013,107,1,19.00),
-- cmd 1014 (Hana)
(25,1014,108,2,15.00),
(26,1014,109,1,12.00),
-- cmd 1015 (Hana)
(27,1015,101,1,24.90),
(28,1015,110,1,22.00),
(29,1015,107,1,19.00);
