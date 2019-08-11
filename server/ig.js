const puppeteer = require('puppeteer');

class Ig {
  constructor() {
    this.selectors = {
  
    }
  }

  async followScript (actions) {
    await this.page.waitForSelector('input[name="username"]');
    await this.page.waitFor(1000);
    await this.page.click('input[name="username"]');
    await this.page.keyboard.type('');
    await this.page.waitFor(500);
    await this.page.click('input[name="password"]');
    await this.page.keyboard.type('');
    await this.page.waitFor(500);
    await this.page.click('button[type="submit"]');
  }

  async followUnfollow () {
    const allowedDailyActions = 200;

    const scriptActions = allowedDailyActions / 24

    this.followScript(scriptActions / 2);
    // this.unfollowScript(scriptActions / 2);
  }

  async launchBrowser () {
    const browser = await puppeteer.launch({headless: false});
    const pages = await browser.pages();
    this.page = await pages[0];

    this.page.goto('https://www.instagram.com/accounts/login/');
  }

  async start() {
    await this.launchBrowser();
    await this.followUnfollow();
  }
}

module.exports = {
  Ig
}