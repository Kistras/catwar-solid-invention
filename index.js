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
global.wb = require('selenium-webdriver');
const moment = require('moment')


postedid = { // ID комментария
    "https://catwar.su/blogs": null,
    "https://catwar.su/sniff": null
} 
blogid = { // ID блога
    "https://catwar.su/blogs": 923180,
    "https://catwar.su/sniff": 923351
}

timelimit = {
    "https://catwar.su/blogs": moment(new Date()).add(3, 'm').toDate(),
    "https://catwar.su/sniff": moment(new Date()).add(1, 'm').toDate()
}
text = {
    "https://catwar.su/blogs": ".",
    "https://catwar.su/sniff": "[img]https://i.imgur.com/AP5ei3l.png[/img]"
}
anon = { // Псевдоним, под которым нужно отправлять текст. 
         // Если != "" и запрещено в посте, то выведет ошибку (и перестанет отправлять). Если пустое, то запостит с ником аккаунта
    "https://catwar.su/blogs": ".",
    "https://catwar.su/sniff": "."
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

async function updatepost(kill, url) {
    await driver.get(`${url.replace('blogs', 'blog')}${blogid[url]}`)
    await sleep(3000)
    b = await driver.findElements(By.xpath("//a[@class='comment-delete' and text()='Удалить' and @style!='display: none;']"))
    for (s of b) {
        s.click()
        await sleep(500)
    }
    if (!kill) {
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
                blogid[url] = null
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
        postedid[url] = null
        blogid[url] = null
        timelimit[url] = null
    }
}

let consec_updates = 0
let url
async function loop() {
    // Checking state
    const cururl = await driver.getCurrentUrl()
    if (cururl == 'https://catwar.su/login') {
        await login()
        await sleep(1000)
        consec_updates = -1
    } else {
        consec_updates = (consec_updates + 1) % 60 // Reset page every 60 requests just in case
        url = (consec_updates % 20) == 0 ? "https://catwar.su/blogs" : "https://catwar.su/sniff"
        // We check blogs every 20 updates (~14 seconds) since they are not as active as sniffs are
        if (consec_updates == 0 || cururl != url) {
            await driver.get(url)
            await sleep(2000)
        }
        console.log(url, consec_updates)
        try {
            if (blogid[url] && timelimit[url] < new Date()) {
                console.log(timelimit[url], postedid[url], blogid[url])
                await updatepost(true, url)
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

(async function start() {
    let driver = await new Builder()
    .forBrowser(Browser.FIREFOX)
    .setFirefoxOptions(new firefox.Options().setBinary(FIREFOX_PATH))
    .build()
    global.driver = driver
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
    }
})()

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