let db = null;
const db_version = '1.0';
let dbSize_mb = 20;

const defaultNum = 0;
const defaultVal = null;

let questionCnt=0;
let index = 0;
let indexArr = [];
let categoryIdx= 1;
let questionList = null;
let categoryList = {};

function init() {
    printMainPage();
    console.log(window.innerHeight +" "+ window.outerHeight);
    console.log(window.innerWidth +" "+ window.outerWidth);
}

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
    categoryIdx = $("#select-category-2 option:selected").val();
    db.transaction(function(ps) {
        const question = $('#input-question').val();
        const answer = $('#input-answer').val();

        if (isEmptyStr(question)) { alert('문제를 입력해주세요'); return -1; }
        if (isEmptyStr(answer)) { alert('정답을 입력해주세요'); return -2; }

        let insertSQL = 'insert into question(question, answer, category_id, right, wrong) values(?,?,?,?,?)';

        ps.executeSql(insertSQL, [question, answer, categoryList[categoryIdx].category_id, defaultNum, defaultNum],
            function(ps, rs) {
                alert('질문 "' + question +'"' + ' 이 등록되었습니다');
                printMainPage();
                location.replace('#page-main');
            },function() {
                alert('질문 등록에 실패헸습니다');
            });
    });
}

// execute get qestion tranaction
function getQuestion() {
    $('#h1-study').text(categoryList[categoryIdx].category_name);
    db.transaction(function(ps) {
        const selectCntQuestion = 'select * from question where category_id=?';
        ps.executeSql(selectCntQuestion, [categoryList[categoryIdx].category_id], function(ps, rs) {
            let cnt = rs.rows.length;
            for(i=0; i<cnt; i++) {
                indexArr[i] = i;
            }
            if (cnt == 0) {
                alert("해당 카테고리에는 질문이 없습니다");
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

    selectCategoryList(); // need to fix this line

    db.transaction(function(ps) {
        console.log('select question list');
        const selctQuestionSQL = 'select * from question';
        ps.executeSql(selctQuestionSQL, [], function(ps, rs) {
            const len = rs.rows.length;
            if (len == 0) {
                document.getElementById('list-ul').innerHTML='<li>저장된 질문이 없습니다</li>';
                return ;
            }
            document.getElementById('list-ul').innerHTML='';
            $('#question-count').text('총 ' + rs.rows.length + '개 등록됨');

            // need to fix this code

            for (i=0; i<len; i++) {
                let j=0;
                for(j=0; j<rs.rows.length; j++) {
                    if (categoryList[j]["category_id"]==rs.rows.item(i).category_id) {
                        break;
                    }
                }
                $('#list-ul').append('<li><a data-role="button">'
                                        + '<p>' + 'Q ' + rs.rows.item(i).question + '</p>'
                                        + '<p>' + 'A ' + rs.rows.item(i).answer + '</p>'
                                        + '<div class="ui-li-count">' + categoryList[j]["category_name"] + '</div>'
                                    +'</li></a>');
            }
            $('#list-ul').listview().listview("refresh");
        });
    },function() {
        console.log('5_question list transaction failed');
    },function() {
        console.log('5_question list transaction succeed')
    });
}

function selectCategoryList() {
    db.transaction(function(ps) {
        const selctQuestionSQL = 'select * from category';
        ps.executeSql(selctQuestionSQL, [], function(ps, rs) {
            categoryList = rs.rows;
            console.log('succeed in category list sql');
            let len = categoryList.length;
            document.getElementById('list-ul').innerHTML='';
            $('.select-category').empty();
            for (i=0; i<len; i++) {
                let option = $("<option value=\""+ i +"\" >"+categoryList.item(i).category_name+"</option>");
                $('.select-category').append(option);
            }
            $('#select-category-2').selectmenu().selectmenu("refresh");
        }, function() {
            console.log('failed in ategory list sql');
        });
    },function() {
        console.log('category list transaction failed');
    },function() {
        console.log('category list transaction succeed');
    });
}

function radioCategoryList() {
    db.transaction(function(ps) {
        const selctQuestionSQL = 'select * from category';
        ps.executeSql(selctQuestionSQL, [], function(ps, rs) {
            categoryList = rs.rows;
            console.log('succeed in category list sql');
            let len = categoryList.length;
            document.getElementById('radio-category').innerHTML='';
            $('#radio-category').append('<p>카테고리</p>');
            for (i=0; i<len; i++) {
                let radio = '<input id="category' + categoryList[i].category_id + '" type="radio" value="' + i + '" name="category">\
                <label for="category' + categoryList[i].category_id + '">' + categoryList[i].category_name + '</label>';
                $('#radio-category').append(radio);
            }

            $('#radio-category').trigger('create');
        }, function() {
            console.log('failed in ategory list sql');
        });
    },function() {
        console.log('category list transaction failed');
    },function() {
        console.log('category list transaction succeed');
    });
}

function editCategoryList() {
    db.transaction(function(ps) {
        const selctQuestionSQL = 'select * from category';
        ps.executeSql(selctQuestionSQL, [], function(ps, rs) {
            categoryList = rs.rows;
            console.log('succeed in category list sql');
            let len = categoryList.length;
            document.getElementById('category-setting').innerHTML='';
            $('#category-setting').append('<p>카테고리</p>');
            for (i=0; i<len; i++) {
                let category = '<li>' + categoryList[i].category_name + ' 수정 | 삭제' + '</li>';
                $('#category-setting').append(category);
            }

            $('#category-setting').listview('refresh');
        }, function() {
            console.log('failed in ategory list sql');
        });
    },function() {
        console.log('category list transaction failed');
    },function() {
        console.log('category list transaction succeed');
    });
}

function nextQuestion() {
    if (index < questionList.length - 1) {
        index++;
        reNewQuestion(index);
        location.replace('#page-study');
    } else {
        location.replace('#page-response-done');
        index = 0;
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
}

function reNewQuestion(index) {
    document.getElementById('study-question').innerText = questionList.item(indexArr[index]).question;
    document.getElementById('study-count').innerText = (index+1) + '/' + questionList.length;
    document.getElementById('answer-ratio').innerText = "정답률 " + answerRatio() + "%";
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

function insertNewCategory() {
        db.transaction(function(ps) {
            const insertSQL = 'insert into category(category_name) select "'+ $('#input-category-name').val() +'" where not exists (select * from category where category_name="' + $('#input-category-name').val() +'")';
            ps.executeSql(insertSQL, [],
            function() {
                console.log('Succeed in inserting into category table sql');
            },function() {
                console.log('Failed inserting into category table sql');
            }
            );
        },function() {
            console.log('Failed inserting into category table transaction');
        },function(){
            console.log('Succeed in inserting into category table transaction');
            selectCategoryList();
    }
    );
}

function selectCurrentCategory() {
    categoryIdx = $("#select-category-1 option:selected").val();
}

function radioCurrentCategory() {
    categoryIdx = $('#radio-category input:checked').val();
}

function deleteCategory() {
    db.transaction(function(ps) {
        deleteSQL = 'delete from category where category_id=?';
        ps.executeSql(deleteSQL, [categoryList[categoryIdx].category_id],function() {
                console.log('deleting category sql succeed');
            },function() {
                console.log('failed deleting category sql');
            }
        );
    },function() {
        console.log('failed deleting category transaction');
    },function() {
        console.log('deleting category transaction succeed');
    });
}

function deleteDataInCategory() {
    db.transaction(function(ps) {
        deleteSQL = 'delete from question where category_id=?';
        ps.executeSql(deleteSQL, [categoryList[categoryIdx].category_id],function() {
                console.log('deleting category in data sql succeed');
            },function() {
                console.log('failed deleting category in data sql');
            }
        );
    },function() {
        console.log('failed deleting category in data transaction');
    },function() {
        console.log('deleting category in data transaction succeed');
    });
}

function addAnswerToDialog() {
    $('.answer').empty().listview()
    $('.answer').append('<li><a>' + '정답은 "' + questionList.item(indexArr[index]).answer + '"입니다' + '</li></a>');
    $('.answer').listview('refresh');
}

function responseWrong() {
        db.transaction(function(ps) {
            const insertSQL = 'update question set wrong=wrong+1 where question_id=?';
            ps.executeSql(insertSQL, [questionList[indexArr[index]].question_id],
            function() {
                console.log('Succeed in updating wrong in question table sql');
            },function() {
                console.log('Failed updating wrong in question table sql');
            }
        );
    },function() {
        console.log('Failed updating wrong in question table transaction');
    },function(){
        console.log('Succeed in updating wrong in question table transaction');
    }
    );
}

function responseRight() {
        db.transaction(function(ps) {
            const insertSQL = 'update question set right=right+1 where question_id=?';
            ps.executeSql(insertSQL, [questionList[indexArr[index]].question_id],
            function() {
                console.log('Succeed in updating wrong in question table sql');
            },function() {
                console.log('Failed updating wrong in question table sql');
            }
        );
    },function() {
        console.log('Failed updating wrong in question table transaction');
    },function(){
        console.log('Succeed in updating wrong in question table transaction');
    }
    );
}

function answerRatio() {
    let right = questionList.item(indexArr[index]).right;
    let wrong = questionList.item(indexArr[index]).wrong;
    let sum = right + wrong;
    
    if (sum == 0) {
        return 0;
    }
    return right / (right + wrong) * 100;
}

function printMainPage() {
    db.transaction(function(ps) {
        const selectCntQuestion = 'select count(*) from question';
        ps.executeSql(selectCntQuestion, [], function(ps, rs) {
            questionCnt = rs.rows[0]['count(*)'];
        });
    }, function() {
    }, function() {
        putCntToMainPage();
    });
}

function putCntToMainPage() {
    if (questionCnt == 0) {
        document.getElementById('has-question').innerHTML= '<p>생성한 문제가 없어요!</p>';
        for (i=0; i<document.getElementsByClassName('no-question-hidden').length; i++) {
            document.getElementsByClassName('no-question-hidden')[i].style.display='none';
        }
        for (i=0; i<document.getElementsByClassName('have-question').length; i++) {
            document.getElementsByClassName('have-question')[i].style.display='inline-block';
        }
    } else {
        prefix = '<p class="p-inline text-big">생성한 문제 </p>';
        suffix = '<p class="p-inline text-big">이 있어요</p><p class="text-small">직접 만든 문제로 공부를 시작해보세요!</p>';
        document.getElementById('has-question').innerHTML= prefix + '<p class="p-inline text-big text-underline">' + questionCnt + '건</p>' + suffix;
        
        for (i=0; i<document.getElementsByClassName('have-question').length; i++) {
            document.getElementsByClassName('have-question')[i].style.display='none';
        }
        for (i=0; i<document.getElementsByClassName('no-question-hidden').length; i++) {
            document.getElementsByClassName('no-question-hidden')[i].style.display='inline-block';
        }
    }
    $('#main-question-cnt').trigger('create');
}