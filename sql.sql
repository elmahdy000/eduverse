1. Create Books Table
CREATE TABLE Books (
    book_id INT PRIMARY KEY,
    title VARCHAR(100),
    author VARCHAR(100)
);
2. Create Members Table

CREATE TABLE Members (
    member_id INT PRIMARY KEY,
    name VARCHAR(100)
);

3. Create Borrowings Table
CREATE TABLE Borrowings (
    borrow_id INT PRIMARY KEY,
    book_id INT,
    member_id INT,
    borrow_date DATE,
    FOREIGN KEY (book_id) REFERENCES Books(book_id),
    FOREIGN KEY (member_id) REFERENCES Members(member_id)
);

4. Insert 3 Books
INSERT INTO Books VALUES
(1, 'Database Systems', 'Elmasri'),
(2, 'Clean Code', 'Robert Martin'),
(3, 'C++ Programming', 'Bjarne Stroustrup');
5. Insert 3 Members
INSERT INTO Members VALUES
(1, 'Ahmed'),
(2, 'Mona'),
(3, 'Omar');

6. Insert 4 Borrowing Records
INSERT INTO Borrowings VALUES
(1, 1, 1, '2024-01-10'),
(2, 2, 2, '2024-01-15'),
(3, 3, 1, '2024-02-01'),
(4, 1, 3, '2024-02-20');

7. Show All Book Titles in UPPERCASE
SELECT UPPER(title) AS book_title_uppercase
FROM Books;


8. Show LENGTH of Each Member Name
SELECT name, LENGTH(name) AS name_length
FROM Members;


9. Show Total Borrowings
SELECT COUNT(*) AS total_borrowings
FROM Borrowings;


10. Show Earliest Borrow Date
SELECT MIN(borrow_date) AS earliest_borrow_date
FROM Borrowings;


11. Add a New Column Category to Books
ALTER TABLE Books
ADD category VARCHAR(50);


12. Rename Column Title to Book_Title
ALTER TABLE Books
RENAME COLUMN title TO book_title;


13. Remove Column Author
ALTER TABLE Books
DROP COLUMN author;