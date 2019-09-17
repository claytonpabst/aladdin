const puppeteer = require('puppeteer');

class Ig {
  constructor() {
    this.cookies = [ 
      { 
        name: 'urlgen',
        value: '"{\\"155.98.132.3\\": 17055}:1i0cdu:LJlxkWf0rQtuzxYHNhnUnbNs_tI"',
        domain: '.instagram.com',
        path: '/',
        expires: -1,
        size: 68,
        httpOnly: true,
        secure: true,
        session: true },
      { name: 'ds_user_id',
        value: '4932599860',
        domain: '.instagram.com',
        path: '/',
        expires: 1574216162.441692,
        size: 20,
        httpOnly: false,
        secure: true,
        session: false },
      { name: 'rur',
        value: 'FTW',
        domain: '.instagram.com',
        path: '/',
        expires: -1,
        size: 6,
        httpOnly: true,
        secure: true,
        session: true },
      { name: 'shbid',
        value: '3212',
        domain: '.instagram.com',
        path: '/',
        expires: 1567044959.663956,
        size: 9,
        httpOnly: true,
        secure: true,
        session: false },
      { name: 'csrftoken',
        value: 'yauGwkmTOrrODLOU9QQTuhLvbiMLCS3Z',
        domain: '.instagram.com',
        path: '/',
        expires: 1597889762.441618,
        size: 41,
        httpOnly: false,
        secure: true,
        session: false },
      { name: 'sessionid',
        value: '4932599860%3AiJKRSuZxrsfc4t%3A11',
        domain: '.instagram.com',
        path: '/',
        expires: 1597976159.664466,
        size: 41,
        httpOnly: true,
        secure: true,
        session: false },
      { name: 'shbts',
        value: '1566440159.5607789',
        domain: '.instagram.com',
        path: '/',
        expires: 1567044959.664151,
        size: 23,
        httpOnly: true,
        secure: true,
        session: false 
      },
      { name: 'mid',
        value: 'XV362gAEAAGtSyKbMssgpbsv1uXJ',
        domain: '.instagram.com',
        path: '/',
        expires: 1881800154.188897,
        size: 31,
        httpOnly: false,
        secure: true,
        session: false 
      } 
    ]

    this.unfollowActionLimit = 0;
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
      followersListUsernames: '.PZuss li a.notranslate',
    }
  }

  randomNumber (min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
  }

  async waitForMoreHandles (reference, initialCount, attempt = 0) {
    console.log('more handles attempt', attempt)
    if(attempt > 3) return;

    const handles = await this.page.$$(reference);
    const newCount = handles.length;

    console.log(reference, newCount, initialCount)

    if(initialCount <= newCount) {
      await this.page.waitFor(1000);
      return await this.waitForMoreHandles(reference, initialCount, attempt + 1);
    } else {
      return;
    }
  }

  async scrollUntilEnoughButtonsSayFollow (attempt = 0) {
    if(attempt > 15) return;

    const buttonsThatSayFollowCount = await this.page.evaluate((selectors) => {
      let count = 0;
      const buttons = document.querySelectorAll(selectors.followersListButtons);
      buttons.forEach(button => {
        if(button.innerText === 'Follow'){
          count++;
        }
      });
      return count;
    }, this.selectors)

    if(buttonsThatSayFollowCount < this.actionLimit) {
      await this.page.evaluate(() => {
        document.querySelector('.PZuss').scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'end' });
      })

      await this.waitForMoreHandles(this.selectors.followersListButtons, buttonsThatSayFollowCount);

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
    let i = 0;
    while (this.actionLimit > 0) {
      console.log(this.actionLimit);

      const followButtons = await this.page.$$(this.selectors.followersListButtons);
      const buttonText = await this.page.evaluate(el => el.innerText, followButtons[i]);
      const followersListUsernames = await this.page.$$(this.selectors.followersListUsernames);
      const usernameToFollow = await this.page.evaluate(el => el.innerText, followersListUsernames[i]);
      const followedBefore = await this.db.checkIfFollowedBefore(this.userId, usernameToFollow);
      console.log(buttonText, followedBefore);

      if(buttonText === "Follow" && !followedBefore.length) {
        await this.db.markUsernameAsFollowed(this.userId, usernameToFollow, new Date().getTime(), false);
        await followButtons[i].click();
        await this.page.waitFor(this.randomNumber(3000, 8000));
        this.actionLimit -= 1;
      }

      i++;
    } // end while
  }
  
  async followScript () {
    await this.page.waitForSelector('article._8Rm4L.M9sTE.L_LMM.SgTZ1.ePUX4');
    const searchStr = this.search[Math.floor(Math.random()*this.search.length)];
    console.log(searchStr);
    if(searchStr.includes('@')) {
      await this.page.goto("https://www.instagram.com/" + searchStr.replace('@', ''));
      const cookies = await this.page.cookies();
      // console.log(cookies);
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
    let allowedDailyActions = await this.db.getActionLimit(1); // return [{action_limit:300}]
    allowedDailyActions = allowedDailyActions[0].action_limit;
    console.log(allowedDailyActions);
    const scriptActions = Math.floor(allowedDailyActions / 24);
    this.actionLimit = scriptActions / 2; // divide by 2 because unfollow gets half and follow gets half
    this.unfollowActionLimit = scriptActions / 2
    console.log(this.actionLimit);

    try{
      await this.followScript();
    } catch(e) {
      console.log(e);
    }
    try{
      await this.unfollowScript();
    } catch(e) {
      console.log(e);
    }
  }

  async launchBrowser () {
    this.browser = await puppeteer.launch({headless: false});
    const pages = await this.browser.pages();
    this.page = await pages[0];
    await this.page.setCookie(...this.cookies);

    this.page.goto('https://www.instagram.com');
    // this.page.goto('https://www.instagram.com/accounts/login/');
  }

  async start(app) {
    this.db = app.get('db');
    this.username = process.argv[2];
    this.password = process.argv[3];
    this.userId = 1;
    // console.log(this);
    await this.launchBrowser();
    // await this.login();
    await this.followUnfollow();
  }

  async unfollowScript () {
    const profilesToUnfollow = await this.db.getUserToUnfollow(this.userId, new Date().getTime() - (1000 * 60 * 60 * 24 * 1));
    console.log(profilesToUnfollow.length)
    for(let i=0; i<this.unfollowActionLimit; i++) {
      if(profilesToUnfollow[i]) {
        console.log(profilesToUnfollow[i])
        try{
          await this.page.goto("https://www.instagram.com/" + profilesToUnfollow[i].profile_name);
          await this.page.waitForSelector('.-nal3', {timeout: 7000});
          await this.page.waitFor(1000);
          await this.clickButtonIfInnerTextFound(['Following', 'Requested']);
          await this.page.waitFor(2000);
          await this.page.waitForSelector('div.piCib', {timeout: 4000});
          await this.clickButtonIfInnerTextFound(['Unfollow']);
          await this.db.deleteUsernameFromFollows(this.userId, profilesToUnfollow[i].profile_name);
          await this.page.waitFor(this.randomNumber(3000, 8000));
        } catch (e) {
          try{
            await this.db.deleteUsernameFromFollows(this.userId, profilesToUnfollow[i].profile_name);
          } catch (e2) {
            console.log('error deleting user out of db');
            console.log(e2);
          }
          console.log('error unfollowing someone');
          console.log(e);
        }
      }
    }
    await this.browser.close();
  }

  async clickButtonIfInnerTextFound(targetTextArray) {
    let buttons = await this.page.$$('button');
    for(let i=0; i<buttons.length; i++) {
      buttons = await this.page.$$('button');
      // console.log(buttons);
      const buttonInnerText = await this.page.evaluate(el => el.innerText, buttons[i]);
      if(targetTextArray.includes(buttonInnerText)){
        await buttons[i].click();
      }
    }
  }
}

module.exports = {
  Ig
}