// helpful constants
const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const validMonths = ['jan', 'january', 'feb', 'february', 'mar', 'march', 'apr', 'april', 'may', 'may', 'jun', 'june', 'jul', 'july', 'aug', 'august', 'sep', 'september', 'oct', 'october', 'nov', 'november', 'dec', 'december'];
const unitsTable = {
    "second": "second",
    "seconds": "second",
    "sec": "second",
    "secs": "second",
    "s": "second",
    "minute": "minute",
    "minutes": "minute",
    "min": "minute",
    "mins": "minute",
    "m": "minute",
    "hour": "hour",
    "hours": "hour",
    "hr": "hour",
    "hrs": "hour",
    "h": "hour",
    "day": "day",
    "days": "day",
    "d": "day",
    "week": "week",
    "weeks": "week",
    "wk": "week",
    "wks": "week",
    "month": "month",
    "months": "month",
    "mo": "month",
    "year": "year",
    "years": "year",
    "yr": "year",
    "yrs": "year"
}
const validUnits = Object.keys(unitsTable);
const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// settings
const MAX_LOG_TRACKER = 100;

// DOM elements
const textContainer = document.querySelector('article');
const display = document.getElementById('display');
const cl = document.getElementById('commandline');
const errormsg = document.getElementById('error');
const flairmsg = document.getElementById('flair');
const timezoneDisplay = document.getElementById('timezone');
const helpTable = document.getElementById('help');

// vars
const time = new Date();
const commandLog = [];
var originalTime = time.getTime();
var commandIndex = -1;

// display current time
insertText(parseTimeString(time), 'large');
showFlair("Type help to see a list of commands");

// display timezone
const tzOffset = time.getTimezoneOffset();
const utcOffset = Math.floor( tzOffset / -60 );
timezoneDisplay.innerHTML = (utcOffset > 0)? `UTC+${utcOffset}` : `UTC${utcOffset}`;


// detect command
cl.addEventListener('keydown', (e) => {
    if (e.key == 'Enter') {
        handleCommand(e.target.value.toLowerCase().split(' '));
        
        // log command
        commandLog[0] = e.target.value;
        commandLog.unshift("");
        if (commandLog.length > MAX_LOG_TRACKER)
            commandLog.pop();
        commandIndex = 0;

        // clear value
        cl.value = "";
    } else if (e.key == 'ArrowUp') {
        e.preventDefault();

        if (commandIndex == 0)
            commandLog[0] = cl.value;
        if (commandIndex < commandLog.length - 1) {
            commandIndex++;
            cl.value = commandLog[commandIndex];
            moveCursorToEnd();
        }
    } else if (e.key == 'ArrowDown') {
        if (commandIndex > 0) {
            commandIndex--;
            cl.value = commandLog[commandIndex];
            moveCursorToEnd();
        }
    } else {
        commandIndex = 0;
        commandLog[0] = cl.value;
    }
});


function handleCommand(args, chaining=false) {
    const cmd = args.shift();

    if (cmd == "help")
        handleHelpCommand();
    else if (cmd == "show")
        handleShowCommand();
    else if (cmd == "setorg")
        handleSetOrgCommand();
    else if (!isNaN(cmd) && (cmd.startsWith('+') || cmd.startsWith('-')))
        handleAddCommand([cmd, ...args]);
    else if (['add', 'plus', 'append', '+'].includes(cmd))
        handleAddCommand(args);
    else if (['sub', 'subtract', 'minus', 'remove', '-'].includes(cmd))
        handleSubCommand(args);
    else if (['compare', 'diff', '='].includes(cmd))
        handleCompareCommand(args);
    else if (['set', ':='].includes(cmd))
        handleSetTime(args);
    else if (['clear', 'clr', 'reset', 'cls', 'c'].includes(cmd))
        handleClear();
    else if (['now', 'today', 'current', 'present'].includes(cmd))
        handleToday();
    else if (chaining) {
        insertText(parseTimeString(time), 'result');
        hideError();
    }
    else
        showError("Invalid command", 'negative');
}


// commands
function handleHelpCommand() {
    const helpClone = helpTable.cloneNode(true);
    helpClone.classList.add('shown');
    display.appendChild(helpClone);
    clearTempMsg();
    scrollToBottom();
}

function handleShowCommand() {
    insertText(parseTimeString(time), 'large');
    clearTempMsg();
    scrollToBottom();
}

function handleSetOrgCommand() {
    originalTime = time.getTime();
    showFlair("Set original time to working time.");
    scrollToBottom();
}

function handleAddCommand(args) {
    // check command validity
    if (!verifyAddOrSubtract(args)) {
        showError("Invalid arguments");
        return;
    }

    // perform operation
    const amt = Number(args[0]);
    const unit = unitsTable[args[1]];
    if (amt < 0)
        insertText(`-${-amt} ${unit}${(amt < -1)? 's' : ''}`, 'negative');
    else
        insertText(`+${amt} ${unit}${(amt > 1)? 's' : ''}`, 'positive');
    updateTime(unit, amt);

    // parse other command chain or show result
    const newArgs = args.slice(2);
    if (newArgs.length > 0) {
        handleCommand(newArgs, true);
    } else {
        insertText(parseTimeString(time), 'result');
        clearTempMsg();
        scrollToBottom();
    }
}

function handleSubCommand(args) {
    if (!verifyAddOrSubtract(args)) {
        showError("Invalid arguments");
        return;
    }

    const n = Number(args[0]);
    handleAddCommand([-n, ...args.slice(1)]);
}

function handleClear() {
    clearTempMsg();
    display.innerHTML = "";
    time.setTime(originalTime);
    insertText(parseTimeString(time), 'large');
    showFlair('Cleared screen and reset to original time.');
}

function handleToday() {
    clearTempMsg();
    display.innerHTML = "";
    time.setTime(Date.now());
    insertText(parseTimeString(time), 'large');
    showFlair('Updated time to the present.');
}

function handleCompareCommand(args) {
    // check argument case
    const dateCase = verifyDateArgs(args);
    if (dateCase == 0) {
        showError("Invalid arguments");
        return;
    }

    // get date
    const date = extractDateArgs(args, dateCase);
    if (isNaN(date.valueOf())) {
        showError("Invalid date");
        return;
    }

    // preliminary assessment
    const msdiff = time - date;
    if (msdiff > 0)
        insertText(`is ahead of ${parseTimeString(date)}`, 'positive')
    else
        insertText(`is behind of ${parseTimeString(date)}`, 'negative')

    // compute constants
    const larger = (msdiff > 0)? time : date;
    const smaller = (msdiff > 0)? date : time;

    // compute diffs
    var dyear = larger.getFullYear() - smaller.getFullYear();
    var dmonth = larger.getMonth() - smaller.getMonth();
    var dday = larger.getDate() - smaller.getDate();
    var dhour = larger.getHours() - smaller.getHours();
    var dmin = larger.getMinutes() - smaller.getMinutes();
    var dsec = larger.getSeconds() - smaller.getSeconds();

    // adjust negatives
    if (dsec < 0) {
        dmin -= 1;
        dsec += 60;
    }
    if (dmin < 0) {
        dhour -= 1;
        dmin += 60;
    }
    if (dhour < 0) {
        dday -= 1;
        dhour += 24;
    }
    if (dday < 0) {
        dmonth -= 1;
        dday += daysInMonth[posMod(larger.getMonth() - 1, 12)];
    }
    if (dmonth < 0) {
        dyear -= 1;
        dmonth += 12;
    }

    // return result text
    const plural = (num) => (Math.abs(num) != 1) ? 's' : '';
    insertText(`by ${dyear} year${plural(dyear)}, ${dmonth} month${plural(dmonth)}, ${dday} day${plural(dday)}, ${dhour} hour${plural(dhour)}, ${dmin} minute${plural(dmin)}, and ${dsec} second${plural(dsec)} (${Math.abs(Math.floor(msdiff / 864000) / 100)} days)`, 'result');

    // parse other command chain
    const argsUsed = (dateCase >= 3)? dateCase + 1 : dateCase + 2;
    const newArgs = args.slice(argsUsed);
    if (newArgs.length > 0) {
        handleCommand(newArgs, true);
    } else {
        clearTempMsg();
        scrollToBottom();
    }
}


function handleSetTime(args) {
    // check argument case
    const dateCase = verifyDateArgs(args);
    if (dateCase == 0) {
        showError("Invalid arguments");
        return;
    }

    // get date
    const date = extractDateArgs(args, dateCase);
    if (isNaN(date.valueOf())) {
        showError("Invalid date");
        return;
    }

    display.innerHTML = "";
    time.setTime(date.getTime());
    insertText(parseTimeString(time), 'large');

    // parse other command chain
    const argsUsed = (dateCase >= 3)? dateCase + 1 : dateCase + 2;
    const newArgs = args.slice(argsUsed);
    if (newArgs.length > 0) {
        clearTempMsg();
        showFlair("Updated time.");
        handleCommand(newArgs, false);
    } else {
        clearTempMsg();
        showFlair("Updated time.");
    }
}





// helper function
function clearTempMsg() {
    hideFlair();
    hideError();
}

function hideFlair() {
    flairmsg.classList.remove('shown');
}

function showFlair(flair) {
    flairmsg.innerHTML = flair;
    flairmsg.classList.add('shown');
    scrollToBottom();
}

function hideError() {
    errormsg.classList.remove('shown');
}

function showError(err) {
    errormsg.innerHTML = err;
    errormsg.classList.add('shown');
    scrollToBottom();
}

function updateTime(unit, amt) {
    if (unit == 'second')
        time.setSeconds(time.getSeconds() + amt);
    else if (unit == 'minute')
        time.setMinutes(time.getMinutes() + amt);
    else if (unit == 'hour')
        time.setHours(time.getHours() + amt);
    else if (unit == 'day')
        time.setDate(time.getDate() + amt);
    else if (unit == 'week')
        time.setDate(time.getDate() + 7 * amt);
    else if (unit == 'month')
        time.setMonth(time.getMonth() + amt);
    else if (unit == 'year')
        time.setFullYear(time.getFullYear() + amt);
}

function verifyAddOrSubtract(args) {
    return (args.length >= 2) && (!isNaN(args[0])) && (typeof args[1] == "string") && (validUnits.includes(args[1]));
}

function verifyDateArgs(args) {
    const case1 = (args.length >= 3) && (validMonths.includes(args[0].toLowerCase())) && (!isNaN(trimComma(args[1]))) && (!isNaN(trimComma(args[2])));
    const case2 = case1 && (args.length >= 4) && (args[3].match(/^\d{1,}:\d{1,}(:\d{1,})*$/));
    const case3 = case1 && (args.length >= 4) && (args[3].match(/^\d{1,}(:\d{1,})*(:\d{1,})*([aA][mM]|[pP][mM])$/));
    const case4 = case2 && (args.length >= 5) && (["am", "pm"].includes(args[4].toLowerCase()));
    
    if (case4)
        return 4;
    else if (case3)
        return 3;
    else if (case2)
        return 2;
    else if (case1)
        return 1;
    return 0;
}

function extractDateArgs(args, dateCase) {
    if (dateCase < 1 || dateCase > 4)
        return [];

    var month = args[0].toLowerCase();
    var day = Number(trimComma(args[1]));
    var year = Number(trimComma(args[2]));
    var hour = 0;
    var minute = 0;
    var second = 0;
    var meridiem = 'am';

    // hour, minute, second
    if (dateCase >= 2) {
        const nums = trimMeridiem(args[3]).split(':');
        hour = Number(nums[0]);
        minute = (nums.length > 1) ? Number(nums[1]) : 0;
        second = (nums.length > 2) ? Number(nums[2]) : 0;
    }

    // meridiem
    if (dateCase >= 3) {
        meridiem = (dateCase == 3)? args[3].substring(args[3].length-2) : args[4];
        meridiem = meridiem.toLowerCase();
    } else if (hour >= 12) {
        meridiem = 'pm';
        hour -= 12;
    }

    const dateString = `${month} ${day} ${year} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')} ${meridiem}`;
    return new Date(dateString);
}

function insertText(text, type) {
    const node = document.createElement('p');
    node.innerHTML = text;
    node.className = type;
    display.appendChild(node);
}

function parseTimeString(dateobj) {
    const weekday = weekdays[dateobj.getDay()];
    const monthday = dateobj.getDate();
    const month = months[dateobj.getMonth()];
    const year = dateobj.getFullYear();
    const hours = dateobj.getHours();
    const minutes = dateobj.getMinutes();
    const seconds = dateobj.getSeconds();
    const meridiem = (hours >= 12) ? 'PM' : 'AM';
    return `${weekday}, ${month} ${monthday}, ${year}, ${(hours > 12)? hours - 12 : hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${meridiem}`;
}

function moveCursorToEnd() {
    setTimeout(() => {
        cl.selectionStart = cl.selectionEnd = cl.value.length;
        cl.focus();
    }, 0);
}

function trimComma(str) {
    return str.replaceAll(/,+$/g, '');
}

function trimMeridiem(str) {
    return str.toLowerCase().replaceAll(/(am|pm)$/g, '');
}

function posMod(n, m) {
    return ((n % m) + m) % m;
}

function oppositePolarity(a, b) {
    return (a < 0 && b >= 0) || (a >= 0 && b < 0);
}

function scrollToBottom() {
    textContainer.scrollTop = textContainer.scrollHeight;
}
