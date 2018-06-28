// Der Sourcecode steht unter GPL V 3.0 http://www.gnu.de/documents/gpl-3.0.de.html 
// Der Sourcecode wurde im Rahmen des Master Information Management an der Hochschule Kaiserslautern am Campus Zweibrücken
// Im Modul Mobile Programmierung von den drei Studenten Daniel Weber, Lukas Hemmerling und Stephan Weihrauch entwickelt

const rp = require('request-promise');
const cheerio = require('cheerio');
const cheerioTableparser = require('cheerio-tableparser');
const fs = require('fs');
module.exports = getData;

const options = {
    uri: `https://www.mensaplan.de/zweibruecken/mensa-zweibruecken/index.html`,
    transform: function (body) {
      return cheerio.load(body);
    }
  };
 

var aux = []; //Hilfsarray für das String-Splitting
var day = "";   //Wochentag
var loopCounter = 0; //Schleifenzähler

function getData() {
    return new Promise(resolve => { //Promise, damit in index.js auf Datenaktualisierung gewartet werden kann
        rp(options)                 //Datenabfrage ziehen mit cheerio
        .then(($) => {
            iterateMeal($);         //Anwendung von iterateMeal() auf gezogene Daten 
        }).then(() => {
            resolve();              //Auflösen des Promise, wenn iterateMeal() fertig ausgeführt ist
        })
        .catch(err => {             //Abfangen von Fehlern
            console.log(err);       
            resolve();              //Auflösen des Promises, auch wenn Datenabfrage gescheitert
        });
    });  
}


function iterateMeal($) {
    cheerioTableparser($);    // Aufrufen des Tableparser-Moduls
    data = $("table").parsetable(false, false, true);   // Parsen der Tabelle in Textform (Default wäre HTML) 
                                                        //Ausgabe in Form eines Arrays, welches 5 Arrays (für jede Spalte eins) enthält
    fs.writeFileSync('menus.json', "", 'utf8');         //Löschen des Inhalts der menus.json-Datei, da durch append immer neue Daten angehängt würden                                         
    fs.appendFileSync('menus.json', "{", 'utf8');       //Erstes Einfügen einer Klammer (menu.json-Datei hält ohne diesen Einsatz die Spezifikation nicht ein)
                                                        
    data.forEach(arr => {   // Iteration über das äußere Array 
            loopCounter++;  // Schleifenzähler, damit nach dem letzten Tagesmenü kein Komma eingefügt wird (wird später per If-Abfrage geprüft)
            aux = arr[0].split(/[0-9]/); //Datum wird mitgeparst, aber nicht benötigt, deshalb wird String gesplittet ab der ersten Zahl und in Array gespeichert 
            day = aux[0];           //Nur ersten Teil des gesplitteten Strings verwenden

            var menu = {    // Erschaffung eines Objektes zur Speicherung des jeweiligen Tagesmenüs
                [day] : {   // Wochentag als dynamischer Key
                    meal_1 : "",
                    meal_2 : "",
                    meal_3 : ""
                } 
            };
            
            aux = arr[2].split(/[0-9]/); //Analog zu oben, nur mit Essen und Preis
            menu[day].meal_1 = aux[0];
            
            aux = arr[4].replace(/(\d|\,|\u20AC)/g, "").split(/\//);  // RegEx ersetzt alle Zahlen, Kommas und Eurozeichen im String durch "", Sring wird bei / gesplittet
            menu[day].meal_2 = aux[0].trim();  //Leerzeichen vorne und hinten am String werden durch trim gelöscht, meal_1 und das optionale meal_2 den Werten im Objekt zugewiesen
            menu[day].meal_3 = aux[1].trim();
             
            if (loopCounter === 5) { //Wenn Schleife beim 5. Zähler angekommen ist, wird kein Komma angehängt
                fs.appendFileSync('menus.json', JSON.stringify(menu,null,4).replace(/^\{|\}$/g, ''), 'utf8'); //Anhängen der einzelnen Objekte ins File, vorher Umwandlung in String
                loopCounter = 0; //Zähler zurücksetzen, da Variable global
            } else {
                fs.appendFileSync('menus.json', JSON.stringify(menu,null,4).replace(/^\{|\}$/g, '')+',', 'utf8');
            }       
    })   
    fs.appendFileSync('menus.json', "}", 'utf8'); //Anhängen der schließenden Klammer

}


 

