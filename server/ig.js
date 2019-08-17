const puppeteer = require('puppeteer');

class Ig {
  constructor() {
    this.actionLimit = 0;
    this.search = [
      // "#concerts",
      // "#fashion",
      "@illeniummusic"
    ]
    this.selectors = {
      followersContainer: ".PZuss",
      followersList: '.PZuss li',
      followersListButtons: '.PZuss li button',
    }
  }

  async scrollUntilEnoughButtonsSayFollow (attempt = 0) {
    if(attempt > 15) return;

    let buttonsThatSayFollowCount = 0;
    const buttons = await this.page.$$(this.selectors.followersListButtons);

    for(let i=0; i<buttons.length; i++) {
      const buttonText = await page.evaluate(button => button.textContent, buttons[i]);
      if(buttonText === "Follow") 
        buttonsThatSayFollowCount ++;
    }

    if(buttonsThatSayFollowCount < this.actionLimit) {
      await this.page.evaluate(() => {
        document.querySelector('.PZuss').scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'end' });
      })
      await this.page.waitFor(1000);

      return await this.scrollUntilEnoughButtonsSayFollow(attempt + 1);
    } else {
      return; //should be done scrolling at this point unless it literally cant scroll more. FIXME later to handle the outlier
    }
  }

  async handleProfileTargeting () {
    await this.page.waitForSelector('.-nal3');
    const followersLink = await this.page.$$('.-nal3');
    await followersLink[1].click();
    await this.page.waitForSelector(this.selectors.followersContainer);

    await this.scrollUntilEnoughButtonsSayFollow();
    console.log('hittt');
    while (this.actionLimit > 0) {

  
      this.actionLimit -= 1;

    }
  }
  
  async followScript () {
    await this.page.waitForSelector('article._8Rm4L.M9sTE.L_LMM.SgTZ1.ePUX4');
    const searchStr = this.search[Math.floor(Math.random()*this.search.length)];
    console.log(searchStr);
    if(searchStr.includes('@')) {
      await this.page.goto("https://www.instagram.com/" + searchStr.replace('@', ''));
      await this.handleProfileTargeting();
    } else if (searchStr.includes('#')) {
      console.log('idk');
    }
  }
  
  async login () {
    await this.page.waitForSelector('input[name="username"]');
    await this.page.waitFor(1000);
    await this.page.click('input[name="username"]');
    await this.page.keyboard.type(this.username);
    await this.page.waitFor(500);
    await this.page.click('input[name="password"]');
    await this.page.keyboard.type(this.password);
    await this.page.waitFor(500);
    await this.page.click('button[type="submit"]');
  }

  async followUnfollow () {
    const allowedDailyActions = 200; // db call
    const scriptActions = Math.floor(allowedDailyActions / 24);
    this.actionLimit = scriptActions;
    console.log(this.actionLimit);

    this.followScript();
    // this.unfollowScript(scriptActions / 2);
  }

  async launchBrowser () {
    const browser = await puppeteer.launch({headless: false});
    const pages = await browser.pages();
    this.page = await pages[0];

    this.page.goto('https://www.instagram.com/accounts/login/');
  }

  async start() {
    this.username = process.argv[2];
    this.password = process.argv[3];
    console.log(this);
    await this.launchBrowser();
    await this.login();
    await this.followUnfollow();
  }
}

module.exports = {
  Ig
}