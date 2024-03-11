CREATE TABLE members (
  id INTEGER PRIMARY KEY,
  name VARCHAR(40) UNIQUE,
  password VARCHAR(40),
  api_key VARCHAR(40)
);

CREATE TABLE channels (
    id INTEGER PRIMARY KEY,
    name VARCHAR(40) UNIQUE
);

CREATE TABLE messages (
  id INTEGER PRIMARY KEY,
  channel_id INTEGER,
  member_id INTEGER, 
  text TEXT,
  replies_to INTEGER, 
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(channel_id) REFERENCES channels(id),
  FOREIGN KEY(member_id) REFERENCES members(id),  
  FOREIGN KEY(replies_to) REFERENCES messages(id)
);

CREATE TABLE reactions (
    id INTEGER PRIMARY KEY,
    emoji TEXT,
    message_id INTEGER,
    member_id INTEGER, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(id),
    FOREIGN KEY (member_id) REFERENCES members(id) 
);

CREATE TABLE member_messages (  
    member_id INTEGER,  
    channel_id INTEGER,
    last_seen_message_id INTEGER,
    last_seen_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (member_id, channel_id),
    FOREIGN KEY (member_id) REFERENCES members(id),  
    FOREIGN KEY (channel_id) REFERENCES channels(id),
    FOREIGN KEY (last_seen_message_id) REFERENCES messages(id)
);
