const axios = require('axios');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const fs = require('fs');
const express = require('express');
const app = express();

const PORT = process.env.PORT || 1620;

app.listen(PORT, () => {
    console.log(`server has been started...${PORT}`);
});

let good = `✅✅✅`;
let bad = `❌❌❌`;

//let othersGames = /Simulated|Reality|Cyber|Russia|Masters|Daily|OPEN|Smash|Setka|Cup/
let xhttp = new XMLHttpRequest();
const url1 = 'https://api.telegram.org/bot1219533506:AAFWBi6UMHINMQD0o6zlzCnPFCQCLxbOm2Q/sendMessage?chat_id=-285687209&text='

const getData = async () => {
    let data = await axios.get("https://1xstavka.ru/LiveFeed/Get1x2_VZip?sports=1&count=50&antisports=188&mode=4&country=1&partner=51&getEmpty=true");
    data = await data;
    return data.data;
}

const getGames = (data) => {
    let myGame = [];

    data.forEach( game => {
        let describeGame = {
            id: '',
            country: '',
            game: '',
            name: '',
            title: '',
            player1: '',
            player2: '',
            set: '',
            set1player1: 0,
            set1player2: 0,
            timeGame: 0
        };

        describeGame.id = game.N;
        describeGame.country = game.CN;
        describeGame.title = game.L;
        describeGame.name = game.SN;//
        describeGame.game = game.MIO && game.MIO.TSt || 'simple';
        describeGame.player1 = game.O1;
        describeGame.player2 = game.O2;
        describeGame.field = game.MIO && game.MIO.loc || '';
        describeGame.set = game.SC.CPS;
        describeGame.set1player1 = game.SC.FS && game.SC.FS.S1 || 0;
        describeGame.set1player2 = game.SC.FS && game.SC.FS.S2 || 0;
        describeGame.timeGame = game.SC.TS  || 0;
        myGame.push(describeGame);
    });
    return myGame;
};

const getSelectedGames = (games) => {
    let selectedGame = [];

    games.forEach(game => {
        game.timeGame = Math.ceil(game.timeGame/60);
        let countSet1 = Number(game.set1player1) + Number(game.set1player2);
        if ((countSet1 === 0) && (game.timeGame > 26) && (game.set === '1-й Тайм')) {
            selectedGame.push(game);
        }
    })
    return selectedGame;
};

const getSuccessGames = (games, file) => {
    let statisFile = file.statistics
    let obj = {};
    if(statisFile.allGame) {
        statisFile.allGame.forEach(game => {
            obj[game.id] = game;
        });
        let successGame = [];
        games.forEach(game => {
            if(obj[game.id]) {
                let count = Number(game.set1player1) + Number(game.set1player2);
                if (count > 0) {
                    successGame.push(obj[game.id])
                }
            }
        });
        return successGame;
    }
};

const getFailGames = (games, file) => {
    let statisFile = file.statistics
    let obj = {};
    if(statisFile.allGame) {
        statisFile.allGame.forEach(game => {
            obj[game.id] = game;
        });
        let failGame = [];
        games.forEach(game => {
            if((obj[game.id]) && obj[game.id].timeGame > 45) {
                let count = Number(obj[game.id].set1player1) + Number(obj[game.id].set1player2);
                if (count === 0) {
                    failGame.push(obj[game.id])
                }
            }
        });
        return failGame;
    }
};

const sendMessages = (subject, subjectFile, result) => {
    let obj = {};
    let obj2 = {};
    subject.forEach( game => {
        obj[game.id] = game;
    });

    subjectFile.forEach( game => {
        obj2[game.id] = game;
    });

    Object.keys(obj).forEach( gameId => {
        if (!Object.keys(obj2).length || !(obj2[gameId])) {
            const {
                country, player1, set1player1,
                player2, set1player2, timeGame, id
            } = obj[gameId];

            let text = "Стратегия Футбол\n" +
                `#${id} \n` +
                country + "\n"
                + `${result !== '' ?
                    result === `✅✅✅` ? `✅✅✅ Прошла \n` : `❌❌❌ Не прошла \n` 
                    : `⚠️⚠️⚠️ Начало ставки\n`}`
                + "1 тайм\n"
                + player1 + ":  " + set1player1 + "\n"
                + player2 + ":  " + set1player2 + "\n"
                + `время 1 тайма ${timeGame}\n` +
                "\nМожно ставить на ТБ 0,5 в первом тайме"
            setTimeout(() => {
                xhttp.open("GET", url1 + encodeURIComponent(text), true)
                xhttp.send();
            }, 1000)
        }
    });
};

const FootBallBot = async () => {
    try {
        let file = fs.readFileSync('recover.txt', "utf8", (err) => {
            if (err) throw err;
        })

        app.use('/', (req, res) => {
            res.send(JSON.stringify(file));
        });

        file = JSON.parse(file);

        let data = await getData();
        data = data.Value;

        const games = getGames(data);
        const selectedGames = getSelectedGames(games);
        const successGames = getSuccessGames(games, file)
        const failGames = getFailGames(games, file)

        const reWrite = (file, games) => {
            if (file) {
                if (file.length && !games.length) {
                    return file;
                }
                if (!file.length && games.length) {
                    return games;
                }
                let arr = [...file];
                let obj = {};
                let obj2 = {};

                games.forEach(game => {
                    obj[game.id] = game;
                })
                file.forEach(game => {
                    obj2[game.id] = game;
                })
                Object.keys(obj).forEach(gameId => {
                    if (Object.keys(obj2).length === 0) {
                        arr.push(obj[gameId]);
                    } else {
                        if (!(obj2[gameId])) {
                            arr.push(obj[gameId])
                        }
                    }
                })
                return arr;
            }
        }

        let statisFile = file && file.statistics || {};
        const statistics = {
            hour: new Date().getHours(),
            statistics: {
                hour: new Date().getHours(),
                successCount: statisFile.successGames && statisFile.successGames.length || 0,
                failCount: statisFile.failGames && statisFile.failGames.length || 0,
                allCount: statisFile.allGame && statisFile.allGame.length || 0,
                allGame: reWrite(statisFile.allGame, selectedGames) || [],
                successGames: reWrite(statisFile.successGames, successGames) || [],
                failGames: reWrite(statisFile.failGames, failGames) || []
            },
            actualityGame: selectedGames,
            successGame: successGames,
            failGame: failGames,
        }
console.log(statisFile.allCount, statisFile.failCount, statisFile.successCount)
        if (statisFile.allGame && statistics.actualityGame) {
            if (statistics.actualityGame.length !== statisFile.allGame.length) {
                sendMessages(statistics.actualityGame, statisFile.allGame, '');
            }
        }

        if (statisFile.successGames && statistics.successGame) {
            if (statisFile.successGames.length !== statistics.successGame.length) {
                sendMessages(statistics.successGame, statisFile.successGames, good);
            }
        }

        if (statisFile.failGames && statistics.failGame) {
            if (statisFile.failGames.length !== statistics.failGame.length) {
                sendMessages(statistics.failGame, statisFile.failGames, bad);
            }
        }

        const myWriteFile = (text) => {
            fs.writeFile('recover.txt', text, (err) => {
                if (err) throw err;
            });
        };

        let actualityCount = statistics.actualityGame.length;

        if (statistics.hour === 22 && file.statistics.hour !== 22) {
            const {successCount, failCount, allCount} = file.statistics;
            let passPercent = '100%';
            if (allCount && failCount) {
                passPercent = ((1-failCount/(allCount - actualityCount))*100).toFixed(1) + "% прохода"
            }

            let text = `Статистика за весь день !!!!!\n`+
                        `Всего игр за день: ${allCount}\n`+
                        `Побед: ${successCount} ✅\n`+
                        `Поражений: ${failCount} ❌\n`+
                        `${passPercent}`;
            xhttp.open("GET", url1 + encodeURIComponent(text), true)
            xhttp.send();
            let statistics = {
                hour: 22,
                statistics: {
                    hour: 22,
                    successCount: 0,
                    failCount: 0,
                    allCount: 0,
                    allGame: [],
                    successGames: [],
                    failGames: []
                },
                actualityGame: [],
                successGame: [],
                failGame: []
            };
            myWriteFile(JSON.stringify(statistics, null, 2));
        } else if (statistics.hour !== statisFile.hour) {
            const {successCount, failCount, allCount} = statistics.statistics;
            let passPercent = '100%';
            if (allCount && failCount) {
                passPercent = ((1-failCount/(allCount - actualityCount))*100).toFixed(1) + "% прохода"
            }
            let text = `Статистика\n`+
                        `Всего игр за день: ${allCount}\n`+
                        `Побед: ${successCount} ✅\n`+
                        `Поражений: ${failCount} ❌\n`+
                        `${passPercent}`;
            setTimeout(() => {
                xhttp.open("GET", url1 + encodeURIComponent(text), true)
                xhttp.send();
            }, 1000)
            myWriteFile(JSON.stringify(statistics, null, 2));
        } else {
            myWriteFile(JSON.stringify(statistics, null, 2));
        }
        setTimeout(() => FootBallBot(), 5000);
    } catch (e) {
        console.log(e)
        setTimeout(()=> FootBallBot(), 20000);
    }
};

FootBallBot();
