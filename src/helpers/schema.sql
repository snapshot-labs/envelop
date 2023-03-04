CREATE TABLE subscribers (
  email VARCHAR(256) NOT NULL,
  address VARCHAR(256) NOT NULL,
  created BIGINT NOT NULL,
  PRIMARY KEY (email, address),
  INDEX created (created)
);
