import type { Problem } from "./problems";

/**
 * Cognizant GenC "Tech" round, Mettl hands-on style (two coding problems and two SQL queries per set).
 * Original problems written to the difficulty of reported 2025 papers, with different rules, data and
 * stories. Expected outputs were produced by reference solvers and sqlite3, not by hand.
 */
export const GENC_METTL_PROBLEMS: Problem[] = [
  {
    "id": "genc-festival-switch",
    "title": "Festival mode switch",
    "difficulty": "Easy",
    "tier": "genc",
    "tags": [
      "bits"
    ],
    "statement": "A light board has B switches stored as the lowest B bits of an integer (bit 1 is the rightmost; 1 = on, 0 = off). Festival mode flips every even-numbered switch: bits 2, 4, 6, … up to bit B. Print the board's value after festival mode.",
    "input": "Line 1: B. Line 2: the board's current value.",
    "output": "The new value.",
    "constraints": "1 ≤ B ≤ 30, 0 ≤ value < 2^B",
    "samples": [
      {
        "input": "6\n41\n",
        "output": "3\n",
        "note": "41 is 101001. Flipping bits 2, 4 and 6 (mask 101010) gives 000011 = 3."
      }
    ],
    "tests": [
      {
        "input": "8\n0\n",
        "output": "170\n"
      },
      {
        "input": "8\n255\n",
        "output": "85\n"
      },
      {
        "input": "1\n1\n",
        "output": "1\n"
      },
      {
        "input": "5\n10\n",
        "output": "0\n"
      },
      {
        "input": "30\n123456789\n",
        "output": "770795455\n"
      },
      {
        "input": "2\n3\n",
        "output": "1\n"
      }
    ]
  },
  {
    "id": "genc-locker-splits",
    "title": "Locker code splits",
    "difficulty": "Medium",
    "tier": "genc",
    "tags": [
      "strings",
      "dynamic programming"
    ],
    "statement": "A locker code is a string of digits. Read it as a sequence of pieces, each piece one or two digits long, where no piece starts with 0 and every piece's value is between 1 and K. Count the different ways to split the whole string like that, modulo 1000000007. Print 0 if there is no way.",
    "input": "Line 1: the digit string. Line 2: K.",
    "output": "The number of splits modulo 1000000007.",
    "constraints": "1 ≤ length ≤ 10^5, 1 ≤ K ≤ 99",
    "samples": [
      {
        "input": "1234\n30\n",
        "output": "3\n",
        "note": "1|2|3|4, 12|3|4 and 1|23|4. 34 is above K."
      }
    ],
    "tests": [
      {
        "input": "101\n20\n",
        "output": "1\n"
      },
      {
        "input": "100\n99\n",
        "output": "0\n"
      },
      {
        "input": "9\n5\n",
        "output": "0\n"
      },
      {
        "input": "2222\n22\n",
        "output": "5\n"
      },
      {
        "input": "111111111111111111111111111111111111111111111111111111111111\n99\n",
        "output": "730764433\n"
      },
      {
        "input": "27\n26\n",
        "output": "1\n"
      },
      {
        "input": "0\n10\n",
        "output": "0\n"
      }
    ]
  },
  {
    "id": "genc-heavy-left",
    "title": "Heavier left part",
    "difficulty": "Easy",
    "tier": "genc",
    "tags": [
      "arrays",
      "prefix sum"
    ],
    "statement": "Cut the array at some point into a non-empty left part and a non-empty right part. Count the cut points where the sum of the left part is strictly greater than the sum of the right part.",
    "input": "Line 1: N. Line 2: N integers.",
    "output": "The number of such cut points.",
    "constraints": "2 ≤ N ≤ 10^5, −10^9 ≤ values ≤ 10^9",
    "samples": [
      {
        "input": "5\n4 1 2 3 1\n",
        "output": "2\n",
        "note": "Left sums 4, 5, 7, 10 against right sums 7, 6, 4, 1: the last two cuts count."
      }
    ],
    "tests": [
      {
        "input": "2\n1 1\n",
        "output": "0\n"
      },
      {
        "input": "2\n5 -10\n",
        "output": "1\n"
      },
      {
        "input": "4\n-1 -1 -1 -1\n",
        "output": "1\n"
      },
      {
        "input": "3\n1000000000 1000000000 -1000000000\n",
        "output": "2\n"
      },
      {
        "input": "6\n3 3 3 3 3 3\n",
        "output": "2\n"
      }
    ]
  },
  {
    "id": "genc-vowel-gap",
    "title": "Vowel and consonant gap",
    "difficulty": "Easy",
    "tier": "genc",
    "tags": [
      "strings",
      "hashing"
    ],
    "statement": "Count how often each letter occurs. Print the highest count among the vowels (a, e, i, o, u) that occur, minus the lowest count among the consonants that occur. The answer can be negative.",
    "input": "One line: a string of lowercase letters with at least one vowel and one consonant.",
    "output": "One integer.",
    "constraints": "2 ≤ length ≤ 10^5",
    "samples": [
      {
        "input": "banana\n",
        "output": "2\n",
        "note": "a occurs 3 times; b once and n twice, so 3 − 1 = 2."
      }
    ],
    "tests": [
      {
        "input": "ab\n",
        "output": "0\n"
      },
      {
        "input": "strengths\n",
        "output": "0\n"
      },
      {
        "input": "aeiouxxyyzz\n",
        "output": "-1\n"
      },
      {
        "input": "bbbbcccca\n",
        "output": "-3\n"
      },
      {
        "input": "queueing\n",
        "output": "1\n"
      }
    ]
  },
  {
    "id": "genc-running-echo",
    "title": "Running echo",
    "difficulty": "Easy",
    "tier": "genc",
    "tags": [
      "strings",
      "hashing"
    ],
    "statement": "Replace every character by itself repeated as many times as it has appeared so far, counting this occurrence. Join the pieces with + signs.",
    "input": "One line: a string of lowercase letters.",
    "output": "The joined string.",
    "constraints": "1 ≤ length ≤ 1000",
    "samples": [
      {
        "input": "abcaba\n",
        "output": "a+b+c+aa+bb+aaa\n",
        "note": "The second a becomes aa, the third aaa; b appears twice."
      }
    ],
    "tests": [
      {
        "input": "z\n",
        "output": "z\n"
      },
      {
        "input": "aaaa\n",
        "output": "a+aa+aaa+aaaa\n"
      },
      {
        "input": "hello\n",
        "output": "h+e+l+ll+o\n"
      },
      {
        "input": "abab\n",
        "output": "a+b+aa+bb\n"
      },
      {
        "input": "mississippi\n",
        "output": "m+i+s+ss+ii+sss+ssss+iii+p+pp+iiii\n"
      }
    ]
  },
  {
    "id": "genc-ascii-gap",
    "title": "Symbol pair with an ASCII gap",
    "difficulty": "Easy",
    "tier": "genc",
    "tags": [
      "strings",
      "ascii"
    ],
    "statement": "Find two symbols at different positions i < j whose ASCII codes differ by exactly K. Take the pair with the smallest i, and for that i the smallest j. Print the two symbols next to each other (s[i] then s[j]), or -1 if no pair exists.",
    "input": "Line 1: a string of printable ASCII characters without spaces. Line 2: K.",
    "output": "Two characters, or -1.",
    "constraints": "2 ≤ length ≤ 2000, 0 ≤ K ≤ 94",
    "samples": [
      {
        "input": "a#Bc!\n2\n",
        "output": "ac\n",
        "note": "a (97) and c (99) differ by 2, and a is the earliest symbol that has a partner."
      }
    ],
    "tests": [
      {
        "input": "abc\n5\n",
        "output": "-1\n"
      },
      {
        "input": "AA\n0\n",
        "output": "AA\n"
      },
      {
        "input": "z9A\n32\n",
        "output": "-1\n"
      },
      {
        "input": "!~\n93\n",
        "output": "!~\n"
      },
      {
        "input": "hello\n0\n",
        "output": "ll\n"
      },
      {
        "input": "Pq7r\n1\n",
        "output": "qr\n"
      }
    ]
  },
  {
    "id": "genc-unique-min-grid",
    "title": "Smallest one-off value",
    "difficulty": "Easy",
    "tier": "genc",
    "tags": [
      "matrix",
      "hashing"
    ],
    "statement": "In an N×N grid, find the smallest positive value that appears exactly once in the whole grid. Print -1 if no positive value appears exactly once.",
    "input": "Line 1: N. Then N lines of N integers.",
    "output": "One integer.",
    "constraints": "1 ≤ N ≤ 300, −10^6 ≤ values ≤ 10^6",
    "samples": [
      {
        "input": "3\n4 2 2\n7 -1 4\n0 5 9\n",
        "output": "5\n",
        "note": "2 and 4 repeat, and −1 and 0 are not positive, so 5 is the smallest value seen once."
      }
    ],
    "tests": [
      {
        "input": "1\n3\n",
        "output": "3\n"
      },
      {
        "input": "1\n-3\n",
        "output": "-1\n"
      },
      {
        "input": "2\n1 1\n1 1\n",
        "output": "-1\n"
      },
      {
        "input": "2\n6 0\n2 8\n",
        "output": "2\n"
      },
      {
        "input": "3\n5 5 5\n0 0 0\n-2 9 9\n",
        "output": "-1\n"
      }
    ]
  },
  {
    "id": "genc-step-sequence",
    "title": "Skip-step sequence",
    "difficulty": "Easy",
    "tier": "genc",
    "tags": [
      "arrays",
      "sequences"
    ],
    "statement": "A sequence starts with four given terms T1, T2, T3, T4. From the fifth term on, each term is the previous term plus the term three places back: T[k] = T[k−1] + T[k−3]. Print the first N terms.",
    "input": "Line 1: N. Line 2: the four starting terms.",
    "output": "The first N terms, separated by single spaces.",
    "constraints": "1 ≤ N ≤ 60, −1000 ≤ starting terms ≤ 1000",
    "samples": [
      {
        "input": "8\n1 2 3 4\n",
        "output": "1 2 3 4 6 9 13 19\n",
        "note": "T5 = 4 + 2 = 6, T6 = 6 + 3 = 9, T7 = 9 + 4 = 13, T8 = 13 + 6 = 19."
      }
    ],
    "tests": [
      {
        "input": "2\n5 6 7 8\n",
        "output": "5 6\n"
      },
      {
        "input": "4\n9 9 9 9\n",
        "output": "9 9 9 9\n"
      },
      {
        "input": "10\n0 0 0 1\n",
        "output": "0 0 0 1 1 1 2 3 4 6\n"
      },
      {
        "input": "12\n-3 2 -1 4\n",
        "output": "-3 2 -1 4 6 5 9 15 20 29 44 64\n"
      },
      {
        "input": "60\n1 1 1 1\n",
        "output": "1 1 1 1 2 3 4 6 9 13 19 28 41 60 88 129 189 277 406 595 872 1278 1873 2745 4023 5896 8641 12664 18560 27201 39865 58425 85626 125491 183916 269542 395033 578949 848491 1243524 1822473 2670964 3914488 5736961 8407925 12322413 18059374 26467299 38789712 56849086 83316385 122106097 178955183 262271568 384377665 563332848 825604416 1209982081 1773314929 2598919345\n"
      }
    ]
  },
  {
    "id": "sql-clinic-pending",
    "title": "Pending bills per patient",
    "difficulty": "Medium",
    "tier": "sql",
    "tags": [
      "sql",
      "join",
      "group by",
      "concatenation"
    ],
    "statement": "Tables: patients(id, first_name, last_name, doctor_id) and invoices(id, patient_id, amount, status). For every patient with at least one invoice whose status is 'Pending', print their doctor's id, their full name (first name, a space, last name) and the total of their pending amounts. Ignore invoices with any other status. Order by the total, highest first, then by full name.",
    "input": "A SQLite script that creates and fills the tables runs first (the sample shows one). Write only the query.",
    "output": "One row per patient: doctor_id|full name|total. Columns are separated by | and rows by newlines, as sqlite3 prints them.",
    "constraints": "At most 1000 rows per table.",
    "samples": [
      {
        "input": "CREATE TABLE patients (id INTEGER PRIMARY KEY, first_name TEXT, last_name TEXT, doctor_id INTEGER);\nCREATE TABLE invoices (id INTEGER PRIMARY KEY, patient_id INTEGER, amount INTEGER, status TEXT);\nINSERT INTO patients VALUES (1, 'Riya', 'Sen', 10), (2, 'Om', 'Das', 11), (3, 'Ila', 'Roy', 10);\nINSERT INTO invoices VALUES (1, 1, 400, 'Pending'), (2, 1, 300, 'Paid'), (3, 2, 900, 'Pending'), (4, 1, 250, 'Pending'), (5, 3, 100, 'Paid');\n",
        "output": "11|Om Das|900\n10|Riya Sen|650\n"
      }
    ],
    "tests": [
      {
        "input": "CREATE TABLE patients (id INTEGER PRIMARY KEY, first_name TEXT, last_name TEXT, doctor_id INTEGER);\nCREATE TABLE invoices (id INTEGER PRIMARY KEY, patient_id INTEGER, amount INTEGER, status TEXT);\nINSERT INTO patients VALUES (1, 'A', 'B', 1);\nINSERT INTO invoices VALUES (1, 1, 50, 'Paid');\n",
        "output": "\n"
      },
      {
        "input": "CREATE TABLE patients (id INTEGER PRIMARY KEY, first_name TEXT, last_name TEXT, doctor_id INTEGER);\nCREATE TABLE invoices (id INTEGER PRIMARY KEY, patient_id INTEGER, amount INTEGER, status TEXT);\nINSERT INTO patients VALUES (1, 'Zoya', 'Ali', 3), (2, 'Amit', 'Kale', 4), (3, 'Neel', 'Jha', 3);\nINSERT INTO invoices VALUES (1, 1, 500, 'Pending'), (2, 2, 200, 'Pending'), (3, 2, 300, 'Pending'), (4, 3, 499, 'Pending'), (5, 3, 1, 'Pending');\n",
        "output": "4|Amit Kale|500\n3|Neel Jha|500\n3|Zoya Ali|500\n"
      },
      {
        "input": "CREATE TABLE patients (id INTEGER PRIMARY KEY, first_name TEXT, last_name TEXT, doctor_id INTEGER);\nCREATE TABLE invoices (id INTEGER PRIMARY KEY, patient_id INTEGER, amount INTEGER, status TEXT);\nINSERT INTO patients VALUES (1, 'Kia', 'Mo', 7), (2, 'Lee', 'No', 8);\nINSERT INTO invoices VALUES (1, 2, 75, 'Pending'), (2, 2, 25, 'Refunded'), (3, 1, 10, 'pending');\n",
        "output": "8|Lee No|75\n"
      }
    ]
  },
  {
    "id": "sql-cab-plates",
    "title": "Cabs on a trip with plates ending in 7",
    "difficulty": "Easy",
    "tier": "sql",
    "tags": [
      "sql",
      "join",
      "like",
      "concatenation"
    ],
    "statement": "Tables: drivers(id, first_name, last_name, license_no, rating) and cabs(id, driver_id, plate_no, status). Print the full name (first name, a space, last name), license number and plate number of the driver of every cab whose status is 'On Trip' and whose plate number ends with the digit 7. Order by plate number.",
    "input": "A SQLite script that creates and fills the tables runs first (the sample shows one). Write only the query.",
    "output": "One row per cab: full name|license_no|plate_no. Columns are separated by | and rows by newlines, as sqlite3 prints them.",
    "constraints": "At most 1000 rows per table.",
    "samples": [
      {
        "input": "CREATE TABLE drivers (id INTEGER PRIMARY KEY, first_name TEXT, last_name TEXT, license_no TEXT, rating REAL);\nCREATE TABLE cabs (id INTEGER PRIMARY KEY, driver_id INTEGER, plate_no TEXT, status TEXT);\nINSERT INTO drivers VALUES (1, 'Ravi', 'Nair', 'KA01-1122', 4.6), (2, 'Mona', 'Shah', 'MH02-3344', 4.1);\nINSERT INTO cabs VALUES (1, 1, 'KA05AB1237', 'On Trip'), (2, 2, 'MH12CD4567', 'Idle'), (3, 2, 'MH12EF7777', 'On Trip'), (4, 1, 'KA05GH1230', 'On Trip');\n",
        "output": "Ravi Nair|KA01-1122|KA05AB1237\nMona Shah|MH02-3344|MH12EF7777\n"
      }
    ],
    "tests": [
      {
        "input": "CREATE TABLE drivers (id INTEGER PRIMARY KEY, first_name TEXT, last_name TEXT, license_no TEXT, rating REAL);\nCREATE TABLE cabs (id INTEGER PRIMARY KEY, driver_id INTEGER, plate_no TEXT, status TEXT);\nINSERT INTO drivers VALUES (1, 'A', 'B', 'L1', 4.0);\nINSERT INTO cabs VALUES (1, 1, 'X7Y1', 'On Trip');\n",
        "output": "\n"
      },
      {
        "input": "CREATE TABLE drivers (id INTEGER PRIMARY KEY, first_name TEXT, last_name TEXT, license_no TEXT, rating REAL);\nCREATE TABLE cabs (id INTEGER PRIMARY KEY, driver_id INTEGER, plate_no TEXT, status TEXT);\nINSERT INTO drivers VALUES (1, 'Tara', 'Iyer', 'TN09-5', 4.9), (2, 'Uday', 'Rao', 'AP03-8', 3.9);\nINSERT INTO cabs VALUES (1, 2, 'AP07', 'On Trip'), (2, 1, 'TN17', 'On Trip'), (3, 1, 'TN27', 'Service');\n",
        "output": "Uday Rao|AP03-8|AP07\nTara Iyer|TN09-5|TN17\n"
      },
      {
        "input": "CREATE TABLE drivers (id INTEGER PRIMARY KEY, first_name TEXT, last_name TEXT, license_no TEXT, rating REAL);\nCREATE TABLE cabs (id INTEGER PRIMARY KEY, driver_id INTEGER, plate_no TEXT, status TEXT);\nINSERT INTO drivers VALUES (1, 'Sam', 'Paul', 'GJ-1', 4.2);\nINSERT INTO cabs VALUES (1, 1, 'GJ0177', 'on trip'), (2, 1, 'GJ0187', 'On Trip');\n",
        "output": "Sam Paul|GJ-1|GJ0187\n"
      }
    ]
  },
  {
    "id": "sql-trip-names",
    "title": "Rider and driver for every fourth trip",
    "difficulty": "Medium",
    "tier": "sql",
    "tags": [
      "sql",
      "multi-table join",
      "concatenation"
    ],
    "statement": "Tables: riders(id, first_name, last_name), drivers(id, first_name, last_name, license_no, rating) and trips(id, rider_id, driver_id, pickup, dropoff, status). For every trip whose id is a multiple of 4, print the rider's full name, the driver's full name (each first name, a space, last name), the pickup and the drop-off location. Order by trip id.",
    "input": "A SQLite script that creates and fills the tables runs first (the sample shows one). Write only the query.",
    "output": "One row per trip: rider|driver|pickup|dropoff. Columns are separated by | and rows by newlines, as sqlite3 prints them.",
    "constraints": "At most 1000 rows per table.",
    "samples": [
      {
        "input": "CREATE TABLE riders (id INTEGER PRIMARY KEY, first_name TEXT, last_name TEXT);\nCREATE TABLE drivers (id INTEGER PRIMARY KEY, first_name TEXT, last_name TEXT, license_no TEXT, rating REAL);\nCREATE TABLE trips (id INTEGER PRIMARY KEY, rider_id INTEGER, driver_id INTEGER, pickup TEXT, dropoff TEXT, status TEXT);\nINSERT INTO riders VALUES (1, 'Asha', 'Menon'), (2, 'Dev', 'Gill');\nINSERT INTO drivers VALUES (1, 'Kiran', 'Bose', 'L1', 4.5), (2, 'Jai', 'Puri', 'L2', 4.0);\nINSERT INTO trips VALUES (1, 1, 1, 'Airport', 'MG Road', 'Done'), (4, 2, 1, 'Station', 'Mall', 'Done'), (6, 1, 2, 'Park', 'Lake', 'Done'), (8, 1, 2, 'Office', 'Home', 'Cancelled');\n",
        "output": "Dev Gill|Kiran Bose|Station|Mall\nAsha Menon|Jai Puri|Office|Home\n"
      }
    ],
    "tests": [
      {
        "input": "CREATE TABLE riders (id INTEGER PRIMARY KEY, first_name TEXT, last_name TEXT);\nCREATE TABLE drivers (id INTEGER PRIMARY KEY, first_name TEXT, last_name TEXT, license_no TEXT, rating REAL);\nCREATE TABLE trips (id INTEGER PRIMARY KEY, rider_id INTEGER, driver_id INTEGER, pickup TEXT, dropoff TEXT, status TEXT);\nINSERT INTO riders VALUES (1, 'A', 'B');\nINSERT INTO drivers VALUES (1, 'C', 'D', 'L', 4.0);\nINSERT INTO trips VALUES (3, 1, 1, 'x', 'y', 'Done');\n",
        "output": "\n"
      },
      {
        "input": "CREATE TABLE riders (id INTEGER PRIMARY KEY, first_name TEXT, last_name TEXT);\nCREATE TABLE drivers (id INTEGER PRIMARY KEY, first_name TEXT, last_name TEXT, license_no TEXT, rating REAL);\nCREATE TABLE trips (id INTEGER PRIMARY KEY, rider_id INTEGER, driver_id INTEGER, pickup TEXT, dropoff TEXT, status TEXT);\nINSERT INTO riders VALUES (1, 'Uma', 'Kar'), (2, 'Vik', 'Lal');\nINSERT INTO drivers VALUES (1, 'Wes', 'Ma', 'L', 4.0), (2, 'Xu', 'Ng', 'M', 3.0);\nINSERT INTO trips VALUES (12, 2, 1, 'P1', 'D1', 'Done'), (16, 1, 2, 'P2', 'D2', 'Done'), (20, 2, 2, 'P3', 'D3', 'Done'), (14, 1, 1, 'P4', 'D4', 'Done');\n",
        "output": "Vik Lal|Wes Ma|P1|D1\nUma Kar|Xu Ng|P2|D2\nVik Lal|Xu Ng|P3|D3\n"
      },
      {
        "input": "CREATE TABLE riders (id INTEGER PRIMARY KEY, first_name TEXT, last_name TEXT);\nCREATE TABLE drivers (id INTEGER PRIMARY KEY, first_name TEXT, last_name TEXT, license_no TEXT, rating REAL);\nCREATE TABLE trips (id INTEGER PRIMARY KEY, rider_id INTEGER, driver_id INTEGER, pickup TEXT, dropoff TEXT, status TEXT);\nINSERT INTO riders VALUES (1, 'Ola', 'Ray');\nINSERT INTO drivers VALUES (1, 'Pia', 'Sur', 'L', 5.0);\nINSERT INTO trips VALUES (40, 1, 1, 'Fort', 'Beach', 'Done'), (2, 1, 1, 'A', 'B', 'Done');\n",
        "output": "Ola Ray|Pia Sur|Fort|Beach\n"
      }
    ]
  },
  {
    "id": "sql-manager-contacts",
    "title": "Members who know a manager",
    "difficulty": "Medium",
    "tier": "sql",
    "tags": [
      "sql",
      "join",
      "like",
      "distinct"
    ],
    "statement": "Tables: members(id, first_name, last_name) and contacts(id, member_id, contact_name, job_title). Print the full name (first name, a space, last name) of every member who has at least one contact whose job title contains the word Manager anywhere, in any letter case (Project Manager, manager, Senior MANAGER, …). Print each member once, ordered by full name.",
    "input": "A SQLite script that creates and fills the tables runs first (the sample shows one). Write only the query.",
    "output": "One full name per row. Columns are separated by | and rows by newlines, as sqlite3 prints them.",
    "constraints": "At most 1000 rows per table.",
    "samples": [
      {
        "input": "CREATE TABLE members (id INTEGER PRIMARY KEY, first_name TEXT, last_name TEXT);\nCREATE TABLE contacts (id INTEGER PRIMARY KEY, member_id INTEGER, contact_name TEXT, job_title TEXT);\nINSERT INTO members VALUES (1, 'Neha', 'Joshi'), (2, 'Arun', 'Pillai'), (3, 'Bina', 'Kaur');\nINSERT INTO contacts VALUES (1, 1, 'X', 'Project Manager'), (2, 1, 'Y', 'Product Manager'), (3, 2, 'Z', 'Developer'), (4, 3, 'W', 'senior manager');\n",
        "output": "Bina Kaur\nNeha Joshi\n"
      }
    ],
    "tests": [
      {
        "input": "CREATE TABLE members (id INTEGER PRIMARY KEY, first_name TEXT, last_name TEXT);\nCREATE TABLE contacts (id INTEGER PRIMARY KEY, member_id INTEGER, contact_name TEXT, job_title TEXT);\nINSERT INTO members VALUES (1, 'A', 'B');\nINSERT INTO contacts VALUES (1, 1, 'X', 'Engineer');\n",
        "output": "\n"
      },
      {
        "input": "CREATE TABLE members (id INTEGER PRIMARY KEY, first_name TEXT, last_name TEXT);\nCREATE TABLE contacts (id INTEGER PRIMARY KEY, member_id INTEGER, contact_name TEXT, job_title TEXT);\nINSERT INTO members VALUES (1, 'Zed', 'Ali'), (2, 'Amy', 'Roy'), (3, 'Cal', 'Fox');\nINSERT INTO contacts VALUES (1, 3, 'P', 'MANAGER'), (2, 1, 'Q', 'Manager, Sales'), (3, 2, 'R', 'Management Trainee');\n",
        "output": "Cal Fox\nZed Ali\n"
      },
      {
        "input": "CREATE TABLE members (id INTEGER PRIMARY KEY, first_name TEXT, last_name TEXT);\nCREATE TABLE contacts (id INTEGER PRIMARY KEY, member_id INTEGER, contact_name TEXT, job_title TEXT);\nINSERT INTO members VALUES (1, 'Lia', 'Das'), (2, 'Lia', 'Das');\nINSERT INTO contacts VALUES (1, 1, 'P', 'General Manager'), (2, 2, 'Q', 'Store Manager');\n",
        "output": "Lia Das\n"
      }
    ]
  },
  {
    "id": "sql-repeat-names",
    "title": "Names shared by several viewers",
    "difficulty": "Easy",
    "tier": "sql",
    "tags": [
      "sql",
      "group by",
      "having"
    ],
    "statement": "Table: viewers(id, name, city). Print every name that belongs to more than one viewer, with how many viewers have it. Order by that count, highest first, then by name.",
    "input": "A SQLite script that creates and fills the tables runs first (the sample shows one). Write only the query.",
    "output": "One row per repeated name: name|count. Columns are separated by | and rows by newlines, as sqlite3 prints them.",
    "constraints": "At most 1000 rows per table.",
    "samples": [
      {
        "input": "CREATE TABLE viewers (id INTEGER PRIMARY KEY, name TEXT, city TEXT);\nINSERT INTO viewers VALUES (1, 'Rahul', 'Pune'), (2, 'Sneha', 'Delhi'), (3, 'Rahul', 'Agra'), (4, 'Kavya', 'Pune'), (5, 'Sneha', 'Goa'), (6, 'Rahul', 'Pune');\n",
        "output": "Rahul|3\nSneha|2\n"
      }
    ],
    "tests": [
      {
        "input": "CREATE TABLE viewers (id INTEGER PRIMARY KEY, name TEXT, city TEXT);\nINSERT INTO viewers VALUES (1, 'A', 'x'), (2, 'B', 'y');\n",
        "output": "\n"
      },
      {
        "input": "CREATE TABLE viewers (id INTEGER PRIMARY KEY, name TEXT, city TEXT);\nINSERT INTO viewers VALUES (1, 'Zen', 'a'), (2, 'Zen', 'b'), (3, 'Ada', 'c'), (4, 'Ada', 'd'), (5, 'Moe', 'e');\n",
        "output": "Ada|2\nZen|2\n"
      },
      {
        "input": "CREATE TABLE viewers (id INTEGER PRIMARY KEY, name TEXT, city TEXT);\nINSERT INTO viewers VALUES (1, 'Om', 'a'), (2, 'om', 'b'), (3, 'Om', 'c');\n",
        "output": "Om|2\n"
      }
    ]
  },
  {
    "id": "sql-top-rated-trips",
    "title": "Trips by top-rated drivers",
    "difficulty": "Easy",
    "tier": "sql",
    "tags": [
      "sql",
      "join",
      "where"
    ],
    "statement": "Tables: drivers(id, first_name, last_name, license_no, rating) and trips(id, driver_id, status). Print the license number, driver id, rating and trip id for every trip whose driver has a rating of at least 4.2 and whose status is anything other than 'Cancelled'. Order by trip id.",
    "input": "A SQLite script that creates and fills the tables runs first (the sample shows one). Write only the query.",
    "output": "One row per trip: license_no|driver_id|rating|trip_id. Columns are separated by | and rows by newlines, as sqlite3 prints them.",
    "constraints": "At most 1000 rows per table.",
    "samples": [
      {
        "input": "CREATE TABLE drivers (id INTEGER PRIMARY KEY, first_name TEXT, last_name TEXT, license_no TEXT, rating REAL);\nCREATE TABLE trips (id INTEGER PRIMARY KEY, driver_id INTEGER, status TEXT);\nINSERT INTO drivers VALUES (1, 'Ravi', 'Nair', 'KA01-1122', 4.6), (2, 'Mona', 'Shah', 'MH02-3344', 4.1), (3, 'Isha', 'Gupta', 'DL03-5566', 4.2);\nINSERT INTO trips VALUES (1, 1, 'Completed'), (2, 2, 'Completed'), (3, 3, 'Cancelled'), (4, 3, 'Ongoing'), (5, 1, 'Cancelled');\n",
        "output": "KA01-1122|1|4.6|1\nDL03-5566|3|4.2|4\n"
      }
    ],
    "tests": [
      {
        "input": "CREATE TABLE drivers (id INTEGER PRIMARY KEY, first_name TEXT, last_name TEXT, license_no TEXT, rating REAL);\nCREATE TABLE trips (id INTEGER PRIMARY KEY, driver_id INTEGER, status TEXT);\nINSERT INTO drivers VALUES (1, 'A', 'B', 'L1', 3.0);\nINSERT INTO trips VALUES (1, 1, 'Completed');\n",
        "output": "\n"
      },
      {
        "input": "CREATE TABLE drivers (id INTEGER PRIMARY KEY, first_name TEXT, last_name TEXT, license_no TEXT, rating REAL);\nCREATE TABLE trips (id INTEGER PRIMARY KEY, driver_id INTEGER, status TEXT);\nINSERT INTO drivers VALUES (1, 'C', 'D', 'L9', 5.0);\nINSERT INTO trips VALUES (9, 1, 'Completed'), (3, 1, 'Scheduled'), (7, 1, 'Cancelled');\n",
        "output": "L9|1|5.0|3\nL9|1|5.0|9\n"
      },
      {
        "input": "CREATE TABLE drivers (id INTEGER PRIMARY KEY, first_name TEXT, last_name TEXT, license_no TEXT, rating REAL);\nCREATE TABLE trips (id INTEGER PRIMARY KEY, driver_id INTEGER, status TEXT);\nINSERT INTO drivers VALUES (1, 'E', 'F', 'Q1', 4.19), (2, 'G', 'H', 'Q2', 4.25);\nINSERT INTO trips VALUES (1, 1, 'Completed'), (2, 2, 'Completed');\n",
        "output": "Q2|2|4.25|2\n"
      }
    ]
  }
];
