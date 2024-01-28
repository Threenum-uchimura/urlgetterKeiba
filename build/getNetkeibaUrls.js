/**
/* main.js
/* UrlGetterKeiba - Getting horse url -
**/
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//* Constants
const WINDOW_WIDTH = 1000; // window width
const WINDOW_HEIGHT = 1000; // window height
const DEFAULT_ENCODING = 'utf8'; // encoding
const CSV_ENCODING = 'Shift_JIS'; // csv encoding
const TARGET_URL = 'https://www.netkeiba.com/'; // base url
//* Modules
const electron_1 = require("electron"); // electron
const fs = __importStar(require("fs")); // fs
const sync_1 = __importDefault(require("csv-parse/lib/sync")); // csv parser
const sync_2 = __importDefault(require("csv-stringify/lib/sync")); // csv stfingifier
const iconv_lite_1 = __importDefault(require("iconv-lite")); // text converter
const myScraper_1 = require("./class/myScraper"); // custom Scraper
;
//* General variables
let mainWindow = null; // main window
let resultArray = []; // result array
// scraper
const scraper = new myScraper_1.Scrape();
// header array
const headerObjArray = [
    { key: 'a', header: 'horse' },
    { key: 'b', header: 'url' }, // url
];
// choose csv data
const getCsvData = () => {
    return new Promise((resolve, reject) => {
        // options
        const dialogOptions = {
            properties: ['openFile'],
            title: 'choose csv file',
            defaultPath: '.',
            filters: [
                { name: 'csv(Shif-JIS)', extensions: ['csv'] } // filter
            ],
        };
        // show file dialog
        electron_1.dialog.showOpenDialog(mainWindow, dialogOptions).then((result) => {
            // file exists
            if (result.filePaths.length > 0) {
                // resolved
                resolve(result.filePaths);
                // no file
            }
            else {
                // rejected
                reject(result.canceled);
            }
        }).catch((err) => {
            // error
            console.log(`error occured ${err}`);
            // rejected
            reject(err);
        });
    });
};
// show dialog
const showDialog = (title, message, detail, flg = false) => {
    // dialog options
    const options = {
        type: '',
        title: title,
        message: message,
        detail: detail.toString(),
    };
    // error or not
    if (flg) {
        options.type = 'error';
    }
    else {
        options.type = 'info';
    }
    // show dialog
    electron_1.dialog.showMessageBox(options);
};
// csv file dialog
const getFilename = () => {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        // get csv
        getCsvData()
            // success
            .then(res => {
            const filename = res[0];
            // resolved
            resolve(filename);
        })
            // error
            .catch(err => {
            // show error dialog
            showDialog('no file', 'no csv file selected.', err, true);
            // reject
            reject(new Error('no file error'));
        });
    }));
};
// main
electron_1.app.on('ready', () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // window options
        const windowOptions = {
            width: WINDOW_WIDTH,
            height: WINDOW_HEIGHT,
            defaultEncoding: DEFAULT_ENCODING,
            webPreferences: {
                nodeIntegration: false, // node
            }
        };
        // Electron window
        mainWindow = new electron_1.BrowserWindow(windowOptions);
        // main html
        mainWindow.loadURL('file://' + __dirname + '/index.html');
        // file reading
        const filename = yield getFilename();
        // read file
        fs.readFile(filename, (err, data) => __awaiter(void 0, void 0, void 0, function* () {
            // variable
            let tmpRecords = [];
            // initialize
            yield scraper.init();
            console.log('scraping ..');
            // decoder
            const str = iconv_lite_1.default.decode(data, CSV_ENCODING);
            // error
            if (err)
                throw err;
            // record option
            const recordOptions = {
                columns: false,
                from_line: 2, // from line 2
            };
            // csv reading
            tmpRecords = yield (0, sync_1.default)(str, recordOptions);
            // horse names
            const records = yield tmpRecords.map(item => item[0]);
            // goto page
            yield scraper.doGo(TARGET_URL);
            // waitfor loading
            yield scraper.doWaitSelector('.InputTxt_Form_Box', 30000);
            // loop words
            for (const rd of records) {
                try {
                    // input word
                    yield scraper.doType('.Txt_Form', rd);
                    // click submit button
                    yield scraper.doClick('.Submit_Btn');
                    // wait for loading
                    yield scraper.doWaitFor(2000);
                    // get urls
                    const tmpUrl = yield scraper.getUrl();
                    console.log(`${rd}: ${tmpUrl}`);
                }
                catch (e) {
                    // show error
                    console.log(e);
                    // goto page
                    yield scraper.doGo(TARGET_URL);
                    // waitfor loading
                    yield scraper.doWaitSelector('.InputTxt_Form_Box', 30000);
                }
                finally {
                    console.log(`no data`);
                }
            }
            // stringify option
            const stringifyOptions = {
                header: true,
                columns: headerObjArray,
            };
            // export csv
            const csvString = yield (0, sync_2.default)(resultArray, stringifyOptions);
            // format date
            const formattedDate = (new Date).toISOString().replace(/[^\d]/g, "").slice(0, 14);
            // output csv file
            yield fs.promises.writeFile(`output/${formattedDate}.csv`, csvString);
            // close window
            mainWindow.close();
        }));
        // closing
        mainWindow.on('closed', () => {
            // release window
            mainWindow = null;
        });
    }
    catch (e) {
        // show error dialog
        showDialog('export error', 'error occured when exporting csv.', e, true);
    }
}));
