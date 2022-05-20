let db = null;
let var_no = null;
let position = null;
let dbSize_mb = 20;

// create and open database
function openDB() {
    db = window.openDatabase('amgikingDB', '1.0', 'db for memory data', dbSize_mb * 1024 * 1024)
    console.log('1_Database created');
}