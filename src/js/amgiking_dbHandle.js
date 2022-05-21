let db = null;
const db_version = '1.0';
let dbSize_mb = 20;

const defaultNum = 0;
const defaultVal = null;

let index = 0;
let indexArr = [];
let category_id= 1;
let questionList = null;

function initVariables() {
    index = 0;
    indexArr = [];
    questionList = null;
}

// create and open database
function openDB() {
    db = window.openDatabase('amgikingDB', db_version, 'db for memory data', dbSize_mb * 1024 * 1024);
    console.log('1_Database created');
}

// execute creating question table transaction
function createQuestionTable() {
    db.transaction(function(ps) {
        const createTableSQL = 'CREATE TABLE IF NOT EXISTS question(question_id integer primary key autoincrement, question text, answer text, category_id integer default 1, right integer default 0, wrong integer default 0)';
        ps.executeSql(createTableSQL, [],
            function() {
                console.log('2_1_Succeed in creating question table sql');
            },function() {
                console.log('2_1_Fail to create question table sql');
            });
        },function() {
            console.log('2_2_Fail to creating question table transaction');
        },function(){
            console.log('2_2_Succeed in creating question table transaction');
        });
    }

// execute creating category table transaction
function createCategoryTable() {
        db.transaction(function(ps) {
            const createTableSQL = 'CREATE TABLE IF NOT EXISTS category(category_id integer primary key autoincrement, category_name text default "기본")';
            ps.executeSql(createTableSQL, [],
            function() {
                console.log('Succeed in creating category table sql');
            },function() {
                console.log('Fail to create category table sql');
            }
        );
    },function() {
        console.log('Fail to creating category table transaction');
    },function(){
        console.log('Succeed in creating category table transaction');
    }
    );
}

// execute insert into categoy table default row
function insertDefaultRowInCategoryTable() {
        db.transaction(function(ps) {
            const insertSQL = 'insert into category(category_name) select "기본" where not exists (select * from category where category_name="기본")';
            ps.executeSql(insertSQL, [],
            function() {
                console.log('Succeed in inserting default row in category table sql');
            },function() {
                console.log('Failed inserting default row in category table sql');
            }
        );
    },function() {
        console.log('Failed inserting default row in category table transaction');
    },function(){
        console.log('Succeed in inserting default row in category table transaction');
    }
    );
}

// execute insert data transaction
function insertQuestion() {
    db.transaction(function(ps) {
        const question = $('#input-question').val();
        const answer = $('#input-answer').val();

        if (isEmptyStr(question)) { alert('문제를 입력해주세요'); return -1; }
        if (isEmptyStr(answer)) { alert('정답을 입력해주세요'); return -2; }

        let insertSQL = 'insert into question(question, answer, category_id, right, wrong) values(?,?,?,?,?)';

        ps.executeSql(insertSQL, [question, answer, category_id, defaultNum, defaultNum],
            function(ps, rs) {
                console.log('3_책 등록 no : ' + rs.insertId);
                alert('질문 "' + question +'"' + ' 이 등록되었습니다');
                location.replace('#page-main');
            },function() {
                alert('질문 등록에 실패헸습니다');
            });
    });
}

// execute get qestion tranaction
function getQuestion() {
    db.transaction(function(ps) {
        const selectCntQuestion = 'select * from question where category_id=?';
        ps.executeSql(selectCntQuestion, [category_id], function(ps, rs) {
            let cnt = rs.rows.length;
            for(i=0; i<cnt; i++) {
                indexArr[i] = i;
            }
            if (cnt == 0) {
                alert("목록이 없습니다");
                location.replace('#page-main');
                return ;
            }
            questionList = rs.rows;
            reNewQuestion(index);
        });
    },function() {
        console.log('4_get question failed');
    },function() {
        console.log('4_get question succeed');
    });
}

// execute select question list transaction
function getQuestionList() {
    db.transaction(function(ps) {
        console.log('select question list');
        const selctQuestionSQL = 'select * from question where category_id=?';
        ps.executeSql(selctQuestionSQL, [category_id], function(ps, rs) {
            const len = rs.rows.length;
            if (len == 0) {
                document.getElementById('list-ul').innerHTML='<li>저장된 질문이 없습니다</li>';
                return ;
            }
            document.getElementById('list-ul').innerHTML='';
            $('#list-content').append('<p>' + '총 ' + rs.rows.length + '개 등록됨' + '</p>');
            for (i=0; i<len; i++) {
                $('#list-ul').append('<li class="ui-li-static ui-body-inherit ui-first-child"><a class="ui-link ui-btn ui-shadow ui-corner-all" data-role="button">'
                                        + '<p>' + 'Q ' + rs.rows.item(i).question + '</p>'
                                        + '<p>' + 'A ' + rs.rows.item(i).answer +'</p>'
                                    +'</li></a>');
            }
        });
    },function() {
        console.log('5_question list transaction failed');
    },function() {
        console.log('5_question list transaction succeed')
    });
}

function categoryList() {
    db.transaction(function(ps) {
        console.log('select category list');
        const selctQuestionSQL = 'select * from category';
        ps.executeSql(selctQuestionSQL, [], function(ps, rs) {
            const len = rs.rows.length;
            document.getElementById('list-ul').innerHTML='';
            $('#select-category').empty();
            for (i=0; i<len; i++) {
                let option = $("<option value=\""+rs.rows.item(i).category_id+"\" >"+rs.rows.item(i).category_name+"</option>");
                $('#select-category').append(option);
                
            }
        });
    },function() {
        console.log('category list transaction failed');
    },function() {
        console.log('category list transaction succeed')
    });
}

function responseAnswer() {
    if (index < questionList.length - 1) {
        index++;
        reNewQuestion(index);
    } else {
        alert('모든 문제를 풀었습니다');
        index = 0;
        location.replace('#page-main');
    }
}

function failWithStr(str) {
    console.log(str + ' failed');
}

function succeedWithStr(str) {
    console.log(str + ' succeed');
}

function isEmptyStr(str) {
    if (str.length == 0) {
        return true;
    }
    return false;
}

function shuffleRemainQuestions() {
    let temp = 0;
    let num = 0;
    let start = index;
    for(i=start; i<questionList.length; i++) {
        num = start + Math.floor(Math.random() * (questionList.length - start));
        temp = indexArr[i];
        indexArr[i] = indexArr[num];
        indexArr[num] = temp;
    }
    reNewQuestion(index);
    console.log(indexArr);
}

function reNewQuestion(index) {
    document.getElementById('study-question').innerText = questionList.item(indexArr[index]).question;
    document.getElementById('study-answer').innerText = questionList.item(indexArr[index]).answer;
    document.getElementById('study-count').innerText = (index+1) + '/' + questionList.length;
}

function clearInputQuestion() {
    document.getElementById('input-question').value = '';
    document.getElementById('input-answer').value = '';
}

function deleteAllDatabases() {
    db.transaction(function(ps) {
        deleteSQL = 'drop table question';
        ps.executeSql(deleteSQL, [],function() {
                initVariables();
                console.log('deleting all databases sql succeed');
            },function() {
                console.log('failed deleting all databases sql');
            }
        );
    },function() {
        console.log('failed deleting all databases transaction');
    },function() {
        console.log('deleting all databases transaction succeed');
    });
}