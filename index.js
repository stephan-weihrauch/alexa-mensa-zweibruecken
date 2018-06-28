// Der Sourcecode steht unter GPL V 3.0 http://www.gnu.de/documents/gpl-3.0.de.html 
// Der Sourcecode wurde im Rahmen des Master Information Management an der Hochschule Kaiserslautern am Campus Zweibrücken
// Im Modul Mobile Programmierung von den drei Studenten Daniel Weber, Lukas Hemmerling und Stephan Weihrauch entwickelt

'use strict';
const Alexa = require('alexa-sdk');
const getData = require('./getData.js');
const fs = require('fs');

const APP_ID = 'amzn1.ask.skill.83daa453-d298-4b58-9e83-d336bd17251b';

const SKILL_NAME = 'Mensa Zweibrücken';
const HELP_MESSAGE = 'Du kannst zum Beispiel fragen: Was gibt es heute zu Essen?';
const MENSA_MESSAGE = 'es in der Mensa: ';
const HELP_REPROMPT = 'Frage einfach was gibt es heute zu Essen';
const MENSA_REPROMPT = 'Frage einfach was gibt es heute zu Essen';
const STOP_MESSAGE = 'Lass es dir schmecken!';

const GREETINGS = [               //Begrüßungsmeldungen
    'Willkommen bei Mensa Zweibrücken, du kannst mich fragen, was es zu Essen gibt',
    'Servus, du kannst mich fragen, was es in unserer Mensa zu Essen gibt',
    'Servus, frage einfach was gibt es heute zu Essen',
    'Hallo, möchtest du wissen, was es heute Leckeres in der Mensa gibt?',
    'Es ist schon wieder elf Uhr und du fragst dich, was es in der Mensa gibt?'
];


var d = new Date();
var dayNumber = d.getDay()-1;     //Originale Tagesnummer
var dayNumberMod = d.getDay()-1; //Tagesnummer, welche verändert werden kann (Für Morgen, Gestern etc. => Wichtig für Vergangenheitsform in MENSA_MESSAGE)
var dayArray = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']; 
var menuJSONObj = {}; //Objekt für das menus.json-File


const handlers = {                                  //Handler für Intents
    'LaunchRequest': function () {
        getData()                                   //getData ausführen beim Start von Alexa
        .then(() => {
            const reprompt = MENSA_REPROMPT;        
            const greetings = GREETINGS;
            const greetingsIndex = Math.floor(Math.random() * greetings.length);
            const randomGreeting = greetings[greetingsIndex]; // Aussuchen der Begrüßung 

            this.response.speak(randomGreeting).listen(reprompt);
            this.emit(':responseReady');        //Ausgabe der Begrüßung        
        }) 
    },
    'Unhandled': function () {
        const speechOutput = HELP_REPROMPT;
        this.response.speak(speechOutput);
        this.emit(':responseReady');
    },
    'getMenuToday': function () {
        menuJSONObj = JSON.parse(fs.readFileSync("menus.json", "utf-8")); //Einlesen des JSON-Files in ein Objekt
        const reprompt = MENSA_REPROMPT;
        const output = getMenu(dayNumber, dayNumberMod);                 //Generieren des Outputs
        this.response.speak(output).listen(reprompt);
        this.emit(':responseReady')
    },
    'getMenuTomorrow': function () {
        menuJSONObj = JSON.parse(fs.readFileSync("menus.json", "utf-8"));
        const reprompt = MENSA_REPROMPT;
        const output = getMenu(dayNumber, dayNumberMod+1);                
        this.response.speak(output).listen(reprompt);
        this.emit(':responseReady')
    },
    'getMenuDayAfterTomorrow': function () {
        menuJSONObj = JSON.parse(fs.readFileSync("menus.json", "utf-8"));
        const reprompt = MENSA_REPROMPT;
        const output = getMenu(dayNumber, dayNumberMod+2);
        this.response.speak(output).listen(reprompt);
        this.emit(':responseReady')
    },
    'getMenuYesterday': function () {
        menuJSONObj = JSON.parse(fs.readFileSync("menus.json", "utf-8"));
        const reprompt = MENSA_REPROMPT;
        const output = getMenu(dayNumber, dayNumberMod-1);
        this.response.speak(output).listen(reprompt);
        this.emit(':responseReady')
    },
    'getMenuOnDay': function () {
        menuJSONObj = JSON.parse(fs.readFileSync("menus.json", "utf-8"));
        const reprompt = MENSA_REPROMPT;
        const dayString = this.event.request.intent.slots.wochentag.value;
        const output = getMenuOnDay(dayNumber, dayString);
        this.response.speak(output).listen(reprompt);
        this.emit(':responseReady');
    },
    'AMAZON.HelpIntent': function () {
        menuJSONObj = JSON.parse(fs.readFileSync("menus.json", "utf-8"));
        const speechOutput = HELP_MESSAGE;
        const reprompt = HELP_REPROMPT;

        this.response.speak(speechOutput).listen(reprompt);
        this.emit(':responseReady');
    },
    'AMAZON.CancelIntent': function () {
        this.response.speak(STOP_MESSAGE);
        this.emit(':responseReady');
    },
    'AMAZON.StopIntent': function () {
        this.response.speak(STOP_MESSAGE);
        this.emit(':responseReady');
    },
};

exports.handler = function (event, context, callback) {
    const alexa = Alexa.handler(event, context, callback);
    alexa.appId = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

function numberToDay (dayNumber) {          //Umwandeln der Tagesnummer in einen Tagesstring
    return dayArray[dayNumber];
}

function dayToNumber (day) {                //Umwandeln des Tagesstrings (von den slots eingelesen)
    var  dayCapitalized = day.charAt(0).toUpperCase() + day.slice(1); //Erster Buchstabe wird groß geschrieben, um mit den Tagen im Array verglichen zu werden
    return dayArray.indexOf(dayCapitalized);     //Ausgabe des Index des Tages im Array
}

function getMenu (dayNumber, dayNumberMod) { //Passendes Tagesmenü aus dem Objekt auslesen
    const day = numberToDay(dayNumberMod);   //Tag aus Nummer erzeugen
    const diff = dayNumberMod - dayNumber;   //Differenz der beiden Tagesnummern
    
    var output = "";
    var mensaMessageVerb = "";
    if(diff === -1) output = "Gestern ", mensaMessageVerb = 'gab '; //Auf Basis der Differenz die Strings bilden
    else if(diff === 0) output = "Heute ", mensaMessageVerb = 'gibt ';
    else if(diff === 1) output = "Morgen ", mensaMessageVerb = 'gibt ';
    else if(diff === 2) output = "Übermorgen ", mensaMessageVerb = 'gibt ';

    return generateOutput(menuJSONObj, day, output, mensaMessageVerb); //Rückgabe von generateOutput, die in beide getMenu...-Funktionen passt

}

function getMenuOnDay (dayNumber, dayString) { //getMenu-Funktion nur für Tagesslots
    const dayCapitalized = dayString.charAt(0).toUpperCase() + dayString.slice(1); //dayString erster Buchstabe als Großbuchstabe
    const dayNumberNew = dayToNumber(dayString); 
    const diff = dayNumberNew - dayNumber;

    var output = "";
    var mensaMessageVerb = "";
    if(diff <= -1) output = "Am " + dayString, mensaMessageVerb = ' gab '; //Wenn Differenz kleiner oder gleich -1, dann Vergangenheit
    else if (diff > -1) output = "Am " + dayString, mensaMessageVerb = ' gibt ';

    return generateOutput(menuJSONObj, dayCapitalized, output, mensaMessageVerb); 
}

function generateOutput(menuJSONObj, day, output, mensaMessageVerb) {

    if (day === "Samstag" || day === "Sonntag") return output + mensaMessageVerb + "es in der Mensa leider nichts zu Essen";
    //Abfangen des Falles, dass eine Abfrage für das Wochenende gestellt wird
    const meal_1 = menuJSONObj[day].meal_1; //Zuordnung der jeweiligen Gerichte zu Variablen
    const meal_2 = menuJSONObj[day].meal_2;
    const meal_3 = menuJSONObj[day].meal_3;

    if (menuJSONObj[day].meal_3 !== "") { //Generieren des Ausgabestrings
        output = output + mensaMessageVerb + MENSA_MESSAGE + meal_1 + ", " + meal_2 + " und " + meal_3;
    } else {
        output = output + mensaMessageVerb + MENSA_MESSAGE + meal_1 + " und " + meal_2;
    }
    return output; //Rückgabe des output-Strings
}