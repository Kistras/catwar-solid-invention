/*
https://www.youtube.com/watch?v=clBvZcTpy-s

Am I the one fading in the sun
A light that stole the dark from me
But did the dark deserve to be
*/
const FIREFOX_PATH = 'C:/Program Files/Mozilla Firefox/firefox.exe'
const EMAIL = "tnay1mi4sye@gmail.com"
const PASSWORD = "throwaway666"
const POSTTHR = 2 // Кол-во постов сверху, среди которых должен быть наш

const webdriver = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
// requires geckodriver https://github.com/mozilla/geckodriver/releases/
const {Builder, Browser, By, Key, until} = require('selenium-webdriver');
const moment = require('moment')
const sqlite3 = require('sqlite3').verbose();
let driver

const db = new sqlite3.Database('catwar.sql');

postedid = { // ID комментария
    "https://catwar.su/blogs": null,
    "https://catwar.su/sniff": null
} 
blogid = { // ID блога
    "https://catwar.su/blogs": null,
    "https://catwar.su/sniff": null
}

timelimit = {
    "https://catwar.su/blogs": null,
    "https://catwar.su/sniff": null
}
dbid = {
    "https://catwar.su/blogs": null,
    "https://catwar.su/sniff": null
}
text = {
    "https://catwar.su/blogs": null,
    "https://catwar.su/sniff": null
}
anon = { // Псевдоним, под которым нужно отправлять текст. 
         // Если != "" и запрещено в посте, то выведет ошибку (и перестанет отправлять). Если пустое, то запостит с ником аккаунта
    "https://catwar.su/blogs": null,
    "https://catwar.su/sniff": null
}

//

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function login() {
    try {
        m = await driver.findElement(By.id('mail'))
        m.sendKeys(EMAIL)
        p = await driver.findElement(By.id('pass'))
        p.sendKeys(PASSWORD)
        await sleep(250)
        p.submit()
    } catch (e) {
        console.log('Probably not login', e)
        return 1;
    }
    await sleep(1000)
    return 0;
}

const bsco = {
    "https://catwar.su/blogs": "блога",
    "https://catwar.su/sniff": "ленты"
}

async function updatepost(kill, url, del = true) {
    if (del) {
        await driver.get(`${url.replace('blogs', 'blog')}${blogid[url]}`)
        await sleep(3000)
        b = await driver.findElements(By.xpath("//a[@class='comment-delete' and text()='Удалить' and @style!='display: none;']"))
        for (s of b) {
            s.click()
            await sleep(500)
        }
    }
    if (!kill) {
        console.log(`Обновление комментария ${bsco[url]} ${blogid[url]} (${dbid[url]})`)
        t = await driver.findElement(By.xpath("//input[@id='comment_anon']"))
        t.sendKeys(anon[url])
        t = await driver.findElement(By.xpath("//textarea[@id='comment']"))
        t.sendKeys(text[url])
        await sleep(500)
        t.submit()
        await sleep(1500)
        try {
            error = await driver.findElement(By.xpath("//p[@id='error' and @style!='display: none;'][1]"))
            e = await error.getText()
            console.log(e)
            switch (e) {
            case "Автор запретил оставлять анонимные комментарии.":
                updatepost(kill, url, false)
            break
            case "Любим пофлудить?":
                await sleep(75000)
            break
            default:
                await sleep(30000)
            break
            }
        } catch {
            b = await driver.findElements(By.xpath("//a[@class='comment-delete' and text()='Удалить' and @style!='display: none;']"))
            postedid[url] = await b[b.length-1].getAttribute('data-id')
        }
    } else {
        // Пока что закомментированно
        //db.run("DELETE FROM Sniff WHERE incr = (?)", dbid[url])
        postedid[url] = null
        blogid[url] = null
        timelimit[url] = null
        dbid[url] = null
    }
}

async function reloadsql() { // TODO: МБ убрать повторяющийся код
    if (!blogid["https://catwar.su/blogs"]) {
        db.each(`SELECT * FROM Blogs WHERE start_time < '${moment().subtract(10,'s').format("YYYY-MM-DD HH-mm-ss")}' AND end_time > '${moment().format("YYYY-MM-DD HH-mm-ss")}' ORDER BY incr LIMIT 1`, (err, row) => {
            if (err) {
                console.log(err)
                return
            }
            blogid["https://catwar.su/blogs"] = row.id
            dbid["https://catwar.su/sniff"] = row.incr
            timelimit["https://catwar.su/blogs"] = moment(row.end_time, 'YYYY-MM-DD HH-mm-ss')
            text["https://catwar.su/sniff"] = row.text
            anon["https://catwar.su/sniff"] = row.anon
            console.log(`Поднятие комментария в блоге ${row.id} (${row.incr})`)
        })
    }
    if (!blogid["https://catwar.su/sniff"]) {
        db.each(`SELECT * FROM Sniff WHERE start_time < '${moment().subtract(10,'s').format("YYYY-MM-DD HH-mm-ss")}' AND end_time > '${moment().format("YYYY-MM-DD HH-mm-ss")}' ORDER BY incr LIMIT 1`, (err, row) => {
            if (err) {
                console.log(err)
                return
            }
            blogid["https://catwar.su/sniff"] = row.id
            dbid["https://catwar.su/sniff"] = row.incr
            timelimit["https://catwar.su/sniff"] = moment(row.end_time, 'YYYY-MM-DD HH-mm-ss')
            text["https://catwar.su/sniff"] = row.text
            anon["https://catwar.su/sniff"] = row.anon
            console.log(`Поднятие комментария в ленте ${row.id} (${row.incr})`)
        })
    }
}

let consec_updates = 0
async function loop() {
    // Checking state
    const cururl = await driver.getCurrentUrl()
    if (cururl == 'https://catwar.su/login') {
        console.log('Авторизация')
        await login()
        await sleep(1000)
        consec_updates = -1
    } else {
        consec_updates = (consec_updates + 1) % 20
        const url = consec_updates == 0 ? "https://catwar.su/blogs" : "https://catwar.su/sniff"
        // We check blogs every 20 updates (~14 seconds) since they are not as active as sniffs are
        if (consec_updates == 0 || cururl != url) {
            await driver.get(url)
            await reloadsql()
            await sleep(2000)
        }
        try {
            if (blogid[url] && timelimit[url] < moment()) {
                console.log(`Закончена работа поддержки ${bsco[url]} ${blogid[url]} (${dbid[url]})`)
                await updatepost(true, url)
                await reloadsql()
                return 0
            }
            m = await driver.findElement(By.id('commentsList'))
            m = await m.findElements(By.xpath('//div[@class=\'comment\']'))
            if (blogid[url]) {
                var found = false
                for (var i in m) {
                    if (i >= POSTTHR) break // Limited to first N comments
                    t = m[i]
                    if (!t) break
                    id = await t.getAttribute("data-id")
                    if (postedid[url] == id) {
                        found = true
                        break
                    }
                }
                if (!found) {
                    await updatepost(false, url)
                }
            }
        } catch (e) {
            console.log(e)
        }
    }
}

db.serialize((async function start() {
    console.log('Ну типа запуск')
    driver = await new Builder()
        .forBrowser(Browser.FIREFOX)
        .setFirefoxOptions(new firefox.Options().setBinary(FIREFOX_PATH))
        .build()
    
    db.run("CREATE TABLE IF NOT EXISTS Blogs (incr INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, id INTEGER NOT NULL, text TEXT NOT NULL, anon TEXT, start_time DATETIME NOT NULL, end_time DATETIME NOT NULL)")
    db.run("CREATE TABLE IF NOT EXISTS Sniff (incr INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, id INTEGER NOT NULL, text TEXT NOT NULL, anon TEXT, start_time DATETIME NOT NULL, end_time DATETIME NOT NULL)")
    try {
        await driver.get('https://catwar.su/blogs')
        while (true) {
            await loop()
            await sleep(500)
        }
    } catch (e) {
        console.log(e)
    } finally {
        await driver.quit()
        db.close()
    }
}))

const fs = require("fs")
const clear_require = require('clear-require')
let lastupdate = 0

async function updatecode() {
    clear_require('./botcode.js')

    const text = fs.readFileSync('./botcode.js').toString('utf8')
    let F
    try {
        F = Function(text)
    } catch (e) {
        console.log(e)
        return
    }
    try {
        F()
    } catch (e) {
        console.log(e)
    }
    //module.dobot(bot)
}

fs.watch("botcode.js", (eventType, filename) => {
    const time = new Date().getTime()
    if (eventType === "change" && time - lastupdate > 300) {
        setTimeout(updatecode, 300)
    }
    lastupdate = time
});