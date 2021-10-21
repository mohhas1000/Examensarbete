// Vänta tills hela HTML-dokumentet har laddats klart för exekvering av javascript-kod 
window.addEventListener("load", GUI, false);
// Doc är en global variabel som används för att kunna lägga till diskussionsinlägg och diskussiontrådar i olika funktioner. 
var doc;

// Start av javascript-kod
function GUI() {
    "use strict";

    // Skapar en referensvariabel till exportknappen, och knyter en händelsehanterare till den. 
    var buttonref = document.querySelector(".myButton");

    // För varje gång användaren klickar på knappen, anropas en funktion (exportFunction) som är till för att exportera övningsdata. 
    buttonref.addEventListener("click", exportFunction);
}

// Denna funktion används för att exportera exempelkursens namn, alla diskussionsinlägg och moduler som finns i exempelkursen.
function exportFunction(Event) {

    // Förhindra att standardåtgärden som tillhör händelsen inte kommer att inträffas.  
    Event.preventDefault();
    var nameRef; // En variabel sin ska erhålla exempelkursens namn.

    // Webbadresser som ska användas för att exportera exempelkursens namn, alla diskussioninlägg och moduler. 
    // Localhost hostar en proxy-anywhere server för att undvika CORS-problem. 
    const urls = [
        "http://localhost:3050/https://kau.instructure.com/api/v1/courses/11815?access_token=<<TOKEN>>",
        "http://localhost:3050/https://kau.instructure.com/api/v1/courses/11815/discussion_topics?per_page=40&access_token=<<TOKEN>>",
        "http://localhost:3050/https://kau.instructure.com/api/v1/courses/11815/modules?include=items&access_token=<<TOKEN>>"
    ]

    // Metoden async() användes för att säkerställa att funktionen returnerade ett Promise-objekt.
    const fetchData = async () => {

        // Inställningar
        const settings = {
            method: 'GET',  // Ställer in att det är GET-anrop som applikationen utför.
            headers: {
                'Accept': 'application/json' // Ställer in att applikationen ska acceptera enbart JSON-svar.  
            }
        };
        try { // Försöker exportera de sökta övningsdata från Canvas LMS REST API, och hanterar de inhämtada data. 
            const response = await Promise.all( // Metoden Promise används för att kunna returnera endast ett Promise-objekt av alla de inhämtade data
                urls.map(url => fetch(url, settings).then(res => res.json()))
            )
            setTimeout(function () { // Timeout()-metod för att vänta på att export av de inhämtade data har slutförts
                nameRef = response[0].name;
                manageTitle(response[0].name);
                
            }, 3000);
       

            //En timeout-metod som används för att vänta på de inhämtade data innan den utför funktionen. 
            setTimeout(function () {

                response[1].forEach((element, index) => { // iterera igenom alla diskussionsinlägg. 
                    var topics = []; // En tom array som ska användas för att spara alla diskussiontrådar. 
                    setTimeout(function () { // En timeout-metod som används för att vänta på de inhämtade data innan den utför funktionen. 
                        if (index === 0) { // Första diskussionsinlägg?
                            response[2].forEach( (module, index) => { // Denna iteration används för att se i vilken modul första diskussionsinlägget ligger.
                                module.items.forEach(moduleItem => {
                                    if(moduleItem.title === element.title){  // Ifall diskussionsinlägget ligger i en modul, skicka modulnamnet till funktionen manageDiscussion()
                                        manageDiscussion(element, true, response[2][index].name); // Låt första diskussionsinlägget hamna på första sidan av Word-dokumentet med hjälp av true. 
                                    }
                                })
                            })  
                            
                        } else {
                            response[2].forEach( (module, index) => { // Denna iteration används för att se i vilken modul de resterande diskussionsinläggen ligger.
                                module.items.forEach(moduleItem => { // itererar alla moduler för att matcha. 
                                    if(moduleItem.title === element.title){  // Ifall diskussionsinlägget ligger i en modul, skicka modulnamnet till funktionen manageDiscussion()
                                        manageDiscussion(element, false, response[2][index].name); // Låt de andra diskussioninlägg hamna på en egen sida av Word-dokumentet med hjälp av false.'
                                    }
                                })
                            })  
                        }
                    }, 3000);

                    // Anropar på funktionen fetchFollowingDiscussion, och får som retur ett Promise-objekt med de sökta diskussiontrådar. 
                    // Metoden then() används för att hantera asynkrona uppgifter om att spara all data som returneras från fetchFollowingDiscussion.
                    // Varje diskussionstråd sparas i arrayen topic.
                    fetchFollowingThreads(element.id).then(response => {
                        response.map((item) => {
                            topics.push(item);
                        })
                    });
                    setTimeout(function () { // Vänta 3 sekunder innan funktionen skickar alla inhämtade diskussiontrådar till funktionen managefollowingthreads. 
                        managefollowingThreads(topics);
                    }, 3000);
                })
            });
        } catch (error) { // Här hanterar vi felaktiga svar vid hämtning av diskussioninlägg
            console.log("Error", error)
        }
    }
    fetchData() // Sätter igång exporten.

    
    setTimeout(function () { // Denna metod används för att säkerställa att all övningsdata förs med i Word-dokumentet.
        docx.Packer.toBlob(doc).then(blob => {
            saveAs(blob, "Övningskurs-" + nameRef + ".docx"); // Sparar och döper om filen som övningskursens namn + ".docx"
        });
    }, 6000); // Vänta 6 sekunder 
    
}

// Denna funktion tar emot ett ID för det sökta diskussionsinlägget, och returnera alla diskussionstrådar (deltagarsvar och efterföljande kommentar) -> 
function fetchFollowingThreads(id) {
    return window.fetch('http://localhost:3050/https://kau.instructure.com/api/v1/courses/11815/discussion_topics/' + id + '/entries?access_token=<<TOKEN>>', {
        method: 'GET', // Ställer in att det är GET-anrop som applikationen utför.
        headers: {
            'Accept': 'application/json', // Ställer in att applikationen ska acceptera enbart JSON-svar. 
        }
    })
        // Window.fetch() metoden returnerar ett promise-objekt som innehåller ett response-objekt, som vi behöver ta hand om.
        .then(response => {
            // En if-sats som kollar huruvida respons-objektet är ok eller inte. 
            if (!response.ok) {
                throw response; // Ifall objektet är ej ok, då kastas ett felmeddelande.
            } else {
                return response.json() // Annars returneras ett JSON-objekt där sökta informationen finns.
            }
        })
        .then(data => { // Här hanterar vi data hämtas från Canvas REST API.
            if (data !== null) {
                return data;
            }
        })
        .catch(error => { // Här hanteras felaktiga svar vid hämtning av diskussionstrådar.
            console.log(error);
        })
}

// Denna funktion används för att hantera datum, och se till att det är samma format som Canvas LMS använder sig utav.
function convertDate(d) {
    var parts = d.split("-"); // Split() används för att dela strängen i en lista där varje datumdel sparades som ett listobjekt
    var array = [];
    switch (parts[1]) { // Switch-satsen ersätter månadssiffran som finns i plats 2 i listobjetet, till bokstäver
        case '01': array.push("Jan"); break;
        case '02': array.push("Feb"); break;
        case '03': array.push("Mar"); break;
        case '04': array.push("Apr"); break;
        case '05': array.push("May"); break;
        case '06': array.push("Jun"); break;
        case '07': array.push("Jul"); break;
        case '08': array.push("Aug"); break;
        case '09': array.push("Sep"); break;
        case '10': array.push("Oct"); break;
        case '11': array.push("Nov"); break;
        case '12': array.push("Dec"); break;
    }
    return parts[2] + " " + array[0] + " " + parts[0]; // Returnerar
}

// Denna funktion används för att skapa ett nytt Word-dokument, och lägger till exempelkursens namn som titel.
function manageTitle(title) {
    doc = new docx.Document({ // Skapar ett nytt word-dokument, och tilldelar dokumentet till den globala variabeln doc.
        sections: [{
            children: [
                new docx.Paragraph({ //Skapar en ny paragraf
                    children: [
                        new docx.TextRun({ // Sätter exempelkursens namn som rubrik. 
                            size: 38,
                            heading: "HeadingLevel.HEADING_1",
                            text: "Övningskurs: " + title,
                        }),
                    ],
                    border: { // Style för att få border-underline under titeln.
                         bottom: {
                             color: "auto",
                             space: 6,
                             value: "single",
                             size: 12,
                         },
                     },
                }),
            ],
        }]
    });
}

// Denna funktion lägger till alla diskussionsinlägg i det nyskapade word-dokumentet.   
function manageDiscussion(element, key, moduleName) {
    var types;
    if (key) { // Ifall det är det första diskussionsinlägget (true), låt inlägget hamna i första sidan av Word-dokumentet 
        types = docx.SectionType.CONTINUOUS;
    } else {   // Annars ny sida för varje inlägg.
        types = docx.SectionType.New_Page;
    }
    doc.addSection({ // Lägger till diskussioninlägg med modulnamn i Word-dokumentet.
        properties: {
            type: types,
        },
        children: [
             new docx.Paragraph({
                children: [
                    new docx.TextRun({
                        size: 46,
                        heading: "HeadingLevel.HEADING_1",
                        text: moduleName,
                    }),
                ],
                border: {
                     bottom: {
                         space: 6,
                         color: "black",
                         value: "single",
                         size: 6,
                     },
                     top: {
                         space: 6,
                     },
                 },
            }),
            new docx.Paragraph({
                children: [
                    new docx.TextRun({
                        size: 30,
                        text: element.title,
                    }),
                    new docx.TextRun({
                        size: 26,
                        text: "Diskussionsämne: " + element.message.replace(/\&nbsp;/g, '\n').replace(/<\/?[^>]+>/gi, '').replace(/\s/g, " ").replaceAll('.', '.\n'),
                        break: 1,
                    }),
                ],
                border: {
                     top: {
                         space: 6,
                         color: "black",
                         value: "single",
                         size: 6,
                     },
                     bottom: {
                         space: 6,
                     },
                 },
            }),
        ],
    });
}

// Denna funktion används för att kunna plocka ut varje diskussionstråd (deltagarsvar och efterföljande kommentar) med namn, meddelande och datum. 
function managefollowingThreads(threads) {

    threads.forEach(elementTopics => { // Itererar igenom alla diskussiontrådar
        doc.addSection({ // Lägger till varje deltagarsvar i Word-dokumentet.
            properties: {
                type: docx.SectionType.CONTINUOUS, // Forsätter på samma sida. 
            },
            children: [
                new docx.Paragraph({
                    children: [
                        new docx.TextRun({
                            size: 28,
                            heading: "HeadingLevel.HEADING_2",
                            alignment: "AlignmentType.CENTER",
                            text: "Anonym deltagare", // För att ta ut användarnamn = elementTopics['user'].display_name
                        }),
                        new docx.TextRun({
                            size: 24,
                            heading: "HeadingLevel.HEADING_2",
                            alignment: "AlignmentType.CENTER",
                            text: convertDate(elementTopics['created_at'].substring(0, 10)).toString(), // Datum
                            break: 1, // radbrytning
                        }),
                        new docx.TextRun({
                            size: 25,
                            heading: "HeadingLevel.HEADING_3",
                            alignment: "AlignmentType.CENTER",
                            text: elementTopics.message.replace(/\&nbsp;/g, '\n').replace(/<\/?[^>]+>/gi, '').replace(/\s/g, " "), // Meddelande
                            break: 1, // radbrytning
                        }),
                    ],
                    border: { // Sätter paragraf i en svart ram med hjälp av border-style
                        bottom: {
                            space: 6,
                            color: "black",
                            value: "single",
                            size: 6,
                        },
                        top: {
                            space: 3,
                            color: "black",
                            value: "single",
                            size: 6,
                        },
                        left: {
                            space: 6,
                            color: "black",
                            value: "single",
                            size: 6,
                        },
                        right: {
                            space: 6,
                            color: "black",
                            value: "single",
                            size: 6,
                        },
                    },
                    indent: { // Indentering (margin-left)
                        left: 420,
                    },
                    spacing: { // Sätter ett avstånd före paragraf
                        before: 140,
                    },
                }),
            ],
        });

        if (elementTopics['recent_replies']) { // Finns det efterföljande kommentarer på deltagarsvar? ifall ja gå in i if-satsen. 
            arrayOfRepliesthreads = elementTopics['recent_replies'];
            arrayOfRepliesthreads.sort(function (a, b) {
                // Compare the 2 dates
                if (a.created_at < b.created_at) return -1;
                if (a.created_at > b.created_at) return 1;
                return 0;
            });
            var indent = 0;
            arrayOfRepliesthreads.forEach(function (elementReply, index) { // itererar igenom alla efterföljande kommentar och plocka ut namn, meddelande. 
                
                // Kontrollera ifall följande kommentar är en kommentar på deltagarsvar, eller en kommentar på en efterföljande kommentar.  
                if (arrayOfRepliesthreads[index - 1]) { // Vid första efterföljande kommentar vet vi redan att det är en kommentar på deltagarsvar 
                    if (arrayOfRepliesthreads[index - 1]['id'] === elementReply['parent_id']) { // Ifall ja, skicka intentvärdet + 200 till funktionen addNestedReplyThread()
                        indent += 200;
                        addNestedReplyThread(elementReply, indent);
                    } else { // Annars till funktionen newFollowingReplyThread för en kommentar på deltagarsvar
                        newFollowingReplyThread(elementReply);
                    }
                } else {
                    newFollowingReplyThread(elementReply);
                }
            })
        }
    })

}

// Denna funktion används för att lägga till en  kommentar på ett deltagarsvar, i Word-dokumentet. 
function newFollowingReplyThread(replyThread) {
    doc.addSection({
        properties: {
            type: docx.SectionType.CONTINUOUS,
        },
        children: [
            new docx.Paragraph({
                children: [
                    new docx.TextRun({
                        size: 25,
                        heading: "HeadingLevel.HEADING_2",
                        alignment: "AlignmentType.CENTER",
                        text: "--> Anonym deltagare",
                    }),
                    new docx.TextRun({
                        size: 24,
                        heading: "HeadingLevel.HEADING_2",
                        alignment: "AlignmentType.CENTER",
                        text: convertDate(replyThread['created_at'].substring(0, 10)).toString(),
                        break: 1,
                    }),
                    new docx.TextRun({
                        size: 25,
                        heading: "HeadingLevel.HEADING_2",
                        alignment: "AlignmentType.CENTER",
                        text: replyThread.message.replace(/\&nbsp;/g, '\n').replace(/<\/?[^>]+>/gi, '').replace(/\s/g, " "),
                        break: 1,
                    }),
                ],
                border: {
                    bottom: {
                        space: 6,
                        color: "black",
                        value: "single",
                        size: 6,
                    },
                    top: {
                        space: 6,
                        color: "black",
                        value: "single",
                        size: 6,
                    },
                    left: {
                        space: 6,
                        color: "black",
                        value: "single",
                        size: 6,
                    },
                    right: {
                        space: 6,
                        color: "black",
                        value: "single",
                        size: 6,
                    },
                },
                indent: {
                    left: 620, // Standard värde för indentering
                },
                spacing: {
                    before: 140,
                },
            }),
        ],
    });
}

// Denna funktion används för att lägga till en kommentar på en efterföljande kommentar, i Word-dokumentet. 
function addNestedReplyThread(elementReply, indent) { // Funktionen tar emot objektet och ett indenteringsvärde. 
    doc.addSection({
        properties: {
            type: docx.SectionType.CONTINUOUS,
        },
        children: [
            new docx.Paragraph({
                children: [
                    new docx.TextRun({
                        size: 25,
                        heading: "HeadingLevel.HEADING_2",
                        alignment: "AlignmentType.CENTER",
                        text: "--> Anonym deltagare",
                    }),
                    new docx.TextRun({
                        size: 24,
                        heading: "HeadingLevel.HEADING_2",
                        alignment: "AlignmentType.CENTER",
                        text: convertDate(elementReply['created_at'].substring(0, 10)).toString(),
                        break: 1,
                    }),
                    new docx.TextRun({
                        size: 25,
                        heading: "HeadingLevel.HEADING_2",
                        alignment: "AlignmentType.CENTER",
                        text: elementReply.message.replace(/\&nbsp;/g, '\n').replace(/<\/?[^>]+>/gi, '').replace(/\s/g, " "),
                        break: 1,
                    }),
                ],
                border: {
                    bottom: {
                        space: 6,
                        color: "black",
                        value: "single",
                        size: 6,
                    },
                    top: {
                        space: 6,
                        color: "black",
                        value: "single",
                        size: 6,
                    },
                    left: {
                        space: 6,
                        color: "black",
                        value: "single",
                        size: 6,
                    },
                    right: {
                        space: 6,
                        color: "black",
                        value: "single",
                        size: 6,
                    },
                },
                indent: {
                    left: 620 + indent,
                },
                spacing: {
                    before: 140,
                },
            }),
        ],
    });
}