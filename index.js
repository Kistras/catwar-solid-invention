/*
https://www.youtube.com/watch?v=clBvZcTpy-s

Am I the one fading in the sun
A light that stole the dark from me
But did the dark deserve to be
*/
const FIREFOX_PATH = 'C:/Program Files/Mozilla Firefox/firefox.exe'
EMAIL = "tnay1mi4sye@gmail.com"
PASSWORD = "throwaway666"

// TODO 
postedid = 0
blogid = 0
postthr = 2 // Кол-во постов
//text = "[center][img]http://d.zaix.ru/y7Sz.png[/img][/center][size=13][center]Достижение за 5 кролей![/center][/size]"
text = "[img]https://www.meme-arsenal.com/memes/ce0b5f8bd8c15fafb1d4fc2786bf66c3.jpg[/img]"
anon = "Холодный валенок"

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

const webdriver = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
// requires geckodriver https://github.com/mozilla/geckodriver/releases/

const {Builder, Browser, By, Key, until} = require('selenium-webdriver');
global.wb = require('selenium-webdriver');

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
    await driver.get(`${url}${blogid}`)
    await sleep(3000)
    b = await driver.findElements(By.xpath("//a[@class='comment-delete' and text()='Удалить' and @style!='display: none;']"))
    for (s of b) {
        s.click()
        await sleep(500)
    }
    if (!kill) {
        t = await driver.findElement(By.xpath("//input[@id='comment_anon']"))
        t.sendKeys(anon)
        t = await driver.findElement(By.xpath("//textarea[@id='comment']"))
        t.sendKeys(text)
        await sleep(500)
        t.submit()
        await sleep(1500)
        b = await driver.findElements(By.xpath("//a[@class='comment-delete' and text()='Удалить' and @style!='display: none;']"))
        postedid = await b[b.length-1].getAttribute('data-id')
    } else {
        postedid = null
        blogid = null
    }
}

var consec_updates = 0
var url = "https://catwar.su/sniff"
async function loop() {
    // Checking state
    const cururl = await driver.getCurrentUrl()
    if (cururl == 'https://catwar.su/login') {
        await login()
        await sleep(1000)
        consec_updates = 25000
    }
    else {
        consec_updates += 1
        if (consec_updates > 120 || cururl != url) {
            consec_updates = 0
            await driver.get(url)
            await sleep(2000)
        }
        try {
            m = await driver.findElement(By.id('commentsList'))
            m = await m.findElements(By.xpath('//div[@class=\'comment\']'))
            if (postedid && blogid) {
                var found = false
                consec_updates = 25000
                for (var i in m) {
                    if (i >= postthr) break // Limited to first N comments
                    t = m[i]
                    if (!t) break
                    id = await t.getAttribute("data-id")
                    if (postedid == id) {
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
    setTimeout(loop, 500)
}

(async function start() {
    let driver = await new Builder()
    .forBrowser(Browser.FIREFOX)
    .setFirefoxOptions(new firefox.Options().setBinary(FIREFOX_PATH))
    .build()
    global.driver = driver
    try {
        await driver.get('https://catwar.su/blogs')
        loop()
    } catch (e) {
        console.log(e)
    } finally {
        //await driver.quit()
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