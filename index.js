// helpful constants
const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const validWeekdays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const validMonths = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'january', 'february', 'march', 'april', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
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
    "hour": "hour",
    "hours": "hour",
    "hr": "hour",
    "hrs": "hour",
    "day": "day",
    "days": "day",
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

// main
const display = document.getElementById('display');
const cl = document.getElementById('commandline');
const errormsg = document.getElementById('error');
const flairmsg = document.getElementById('flair');
const time = new Date();
const originalTime = time.getTime();

insertText(parseTimeString(time), 'large');


// detect command
cl.addEventListener('keydown', (e) => {
    if (e.key == 'Enter') {
        handleCommand(e.target.value.toLowerCase().split(' '));
        cl.value = "";
    }
});


function handleCommand(args) {
    const cmd = args.shift();

    if (!isNaN(cmd)) {
        const n = Number(cmd);
        if (n >= 0)
            handleAddCommand([n, ...args]);
        else
            handleSubCommand([-n, ...args]);
    }
    else if (['add', 'plus', 'append', '+'].includes(cmd))
        handleAddCommand(args);
    else if (['sub', 'subtract', 'minus', 'remove', '-'].includes(cmd))
        handleSubCommand(args);
    else if (['clear', 'clr', 'reset', 'cls', 'original', 'back'].includes(cmd))
        handleClear();
    else if (['now', 'today', 'current', 'present'].includes(cmd))
        handleToday();
    else
        showError("Invalid command", 'negative');
}


// commands
function handleAddCommand(args) {
    // check command validity
    if (!verifyAddOrSubtract(args))
        return;

    // perform operation
    const amt = Number(args[0]);
    const unit = unitsTable[args[1]];
    insertText(`+${amt} ${unit}${(amt > 1)? 's' : ''}`, 'positive');
    updateTime(unit, amt);

    // parse other command chain or show result
    const newArgs = args.slice(2);
    if (newArgs.length > 0) {
        handleCommand(newArgs);
    } else {
        insertText(parseTimeString(time), 'result');
        clearTempMsg();
    }
}

function handleSubCommand(args) {
    // check command validity
    if (!verifyAddOrSubtract(args))
        return;

    // perform operation
    const amt = -Number(args[0]);
    const unit = unitsTable[args[1]];
    insertText(`-${-amt} ${unit}${(amt < -1)? 's' : ''}`, 'negative');
    updateTime(unit, amt);

    // parse other command chain or show result
    const newArgs = args.slice(2);
    if (newArgs.length > 0) {
        handleCommand(newArgs);
    } else {
        insertText(parseTimeString(time), 'result');
        clearTempMsg();
    }
}

function handleClear() {
    clearTempMsg();
    display.innerHTML = "";
    time.setTime(originalTime);
    insertText(parseTimeString(time), 'large');
    showFlair('Reset to original time.');
}

function handleToday() {
    clearTempMsg();
    display.innerHTML = "";
    time.setTime(Date.now());
    insertText(parseTimeString(time), 'large');
    showFlair('Updated time to the present.');
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
}

function hideError() {
    errormsg.classList.remove('shown');
}

function showError(err) {
    errormsg.innerHTML = err;
    errormsg.classList.add('shown');
}

function updateTime(unit, amt) {
    if (unit == 'second')
        time.setSeconds(time.getSeconds() + amt);
    else if (unit == 'minute')
        time.setMinutes(time.getMinutes() + amt);
    else if (unit == 'hour')
        time.setHours(time.getHours() + amt);
    else if (unit == 'month')
        time.setMonth(time.getMonth() + amt);
    else if (unit == 'year')
        time.setFullYear(time.getFullYear() + amt);
}

function verifyAddOrSubtract(args) {
    return (args.length >= 2) && (!isNaN(args[0])) && (typeof args[1] == "string") && (validUnits.includes(args[1]));
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
    const meridiem = (hours >= 12) ? 'PM' : 'AM';
    return `${weekday}, ${month} ${monthday}, ${year}, ${(hours > 12)? hours - 12 : hours}:${minutes.toString().padStart(2, '0')} ${meridiem}`;
}
