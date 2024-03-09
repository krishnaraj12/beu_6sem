var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const axios = require('axios');
const cheerio = require('cheerio');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs'); 
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

async function getStudentInfo(registrationNumber) {
    const url = `http://results.beup.ac.in/ResultsBTech6thSem2023_B2020Pub.aspx?Sem=VI&RegNo=${registrationNumber}`;
    try {
        const response = await axios.get(url);
        const html = response.data;
        const $ = cheerio.load(html);

        const studentInfo = {};
        studentInfo.registration_number = registrationNumber;

        const studentNameElement = $('#ContentPlaceHolder1_DataList1_StudentNameLabel_0');
        if (studentNameElement.length) {
            studentInfo.student_name = studentNameElement.text().trim();
            studentInfo.student_father= $('#ContentPlaceHolder1_DataList1_FatherNameLabel_0').text().trim();
            studentInfo.student_mother= $('#ContentPlaceHolder1_DataList1_MotherNameLabel_0').text().trim();
            studentInfo.student_collge= $('#ContentPlaceHolder1_DataList1_CollegeNameLabel_0').text().trim();
            studentInfo.student_branch= $('#ContentPlaceHolder1_DataList1_CourseLabel_0').text().trim();
          
                


        } else {
            studentInfo.student_name = "Student Name Not Found";
        }

        const theorySubjectsTable = $('#ContentPlaceHolder1_GridView1');
        if (theorySubjectsTable.length) {
            studentInfo.theory_subjects_info = [];
            theorySubjectsTable.find('tr').slice(1).each((i, row) => {
                const cols = $(row).find('td');
                const subjectCode = $(cols[0]).text().trim();
                const subjectName = $(cols[1]).text().trim();
                const eseMarks = $(cols[2]).text().trim();
                const iaMarks = $(cols[3]).text().trim();
                const totalMarks = $(cols[4]).text().trim();
                const grade = $(cols[5]).text().trim();
                const credit = $(cols[6]).text().trim();
                studentInfo.theory_subjects_info.push({
                    'subject_code': subjectCode,
                    'subject_name': subjectName,
                    'ese_marks': eseMarks,
                    'ia_marks': iaMarks,
                    'total_marks': totalMarks,
                    'grade': grade,
                    'credit': credit
                });
            });
        } else {
            studentInfo.theory_subjects_info = "Theory Subjects Not Found";
        }

        const practicalSubjectsTable = $('#ContentPlaceHolder1_GridView2');
        if (practicalSubjectsTable.length) {
            studentInfo.practical_subjects_info = [];
            practicalSubjectsTable.find('tr').slice(1).each((i, row) => {
                const cols = $(row).find('td');
                const subjectCode = $(cols[0]).text().trim();
                const subjectName = $(cols[1]).text().trim();
                const eseMarks = $(cols[2]).text().trim();
                const iaMarks = $(cols[3]).text().trim();
                const totalMarks = $(cols[4]).text().trim();
                const grade = $(cols[5]).text().trim();
                const credit = $(cols[6]).text().trim();
                studentInfo.practical_subjects_info.push({
                    'subject_code': subjectCode,
                    'subject_name': subjectName,
                    'ese_marks': eseMarks,
                    'ia_marks': iaMarks,
                    'total_marks': totalMarks,
                    'grade': grade,
                    'credit': credit
                });
            });
        } else {
            studentInfo.practical_subjects_info = "Practical Subjects Not Found";
        }

        const practicalSubjectsTable3 = $('#ContentPlaceHolder1_GridView3');
        if (practicalSubjectsTable3.length) {
            studentInfo.practical_subjects_info2 = [];
            practicalSubjectsTable3.find('tr').slice(1).each((i, row) => {
                const cols = $(row).find('td');
                const one = $(cols[0]).text().trim();
                const two = $(cols[1]).text().trim();
                const three = $(cols[2]).text().trim();
                const four = $(cols[3]).text().trim();
                const five = $(cols[4]).text().trim();
                const six = $(cols[5]).text().trim();
                const seven = $(cols[6]).text().trim();
                const eight = $(cols[7]).text().trim();
                const CGPA = $(cols[8]).text().trim();
                studentInfo.practical_subjects_info2.push({
                    'i': one,
                    'II': two,
                    'III': three,
                    'IV': four,
                    'V': five,
                    'VI': six,
                    'VII': seven,
                    'VIII': eight,
                    'Cur. CGPA': CGPA
                });
            });
        } else {
            studentInfo.practical_subjects_info2 = "Practical Subjects Not Found";
        }

        const sgpaElement = $('#ContentPlaceHolder1_DataList5_GROSSTHEORYTOTALLabel_0');
        if (sgpaElement.length) {
            studentInfo.sgpa = sgpaElement.text().trim();
        } else {
            studentInfo.sgpa = "SGPA Not Found";
        }

        return studentInfo;
    } catch (error) {
        console.error("Error:", error);
        return null;
    }
}

app.get('/result', async (req, res) => {
    const registrationNumber = req.query.registrationNumber;
    if (!registrationNumber) {
        return res.status(400).json({ error: "Registration number is required" });
    }

    try {
        const studentInfo = await getStudentInfo(registrationNumber);
        if (studentInfo) {
            res.json(studentInfo);
        } else {
            res.status(404).json({ error: "Student information not found" });
        }
    } catch (error) {
        console.error("Error fetching student information:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get('/scrape', async (req, res) => {
    const registrationNumber = req.query.registrationNumber;
    if (!registrationNumber) {
        return res.status(400).json({ error: "Registration number is required" });
    }

    try {
        const studentInfo = await getStudentInfo(registrationNumber);
        if (studentInfo) {
            res.render('scrape', { title: 'Scrape', registrationNumber: registrationNumber, message: `${registrationNumber} fetched:`, studentInfo: studentInfo });
        } else {
            console.log(`Failed to retrieve student information for registration number ${registrationNumber}.`);
            res.status(404).json({ error: "Student information not found" });
        }
    } catch (error) {
        console.error("Error scraping data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.use(function(req, res, next) {
    next(createError(404));
});

app.use(function(err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
