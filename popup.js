document.getElementById('getData').addEventListener('click', async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // 将第一段代码包装在Promise中
  const openMenuPromise = new Promise((resolve, reject) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        return new Promise((resolve) => {
          const menuPopup = document.querySelector('body > div.play-game-header-menu__popup-container.play-game-header-menu.popup-module__popup--mv7Tz.popup-module__visible--iwb3h.popup-module__withAnchor--nECOw');
          if (!menuPopup) {
            const fullscreenButton = document.querySelector('#mount > div > div.app__container > div > div.play-game-header.play-game-header_fullscreen-enabled.play-game-header_menu-enabled.play-game-header_with-adv > div > div:nth-child(2)');
            if (fullscreenButton) {
              fullscreenButton.click();
            }
          }

          let attempts = 0;
          const maxAttempts = 10;
          const checkMenuInterval = setInterval(() => {
            const menuButton = document.querySelector('body > div.play-game-header-menu__popup-container.play-game-header-menu.popup-module__popup--mv7Tz.popup-module__visible--iwb3h.popup-module__withAnchor--nECOw > div.play-game-header-menu__menu-container > div > ul > li');
            if (menuButton) {
              menuButton.click();
              clearInterval(checkMenuInterval);
              setTimeout(() => {
                const closeButton = document.querySelector('#mount > div > div.app__container > div > div.game-info > div > div.app-popup__content > div.app-popup__close > span');
                if (closeButton) {
                  closeButton.click();
                }
                resolve(true);
              }, 500);
            } else {
              attempts++;
              if (attempts >= maxAttempts) {
                clearInterval(checkMenuInterval);
                console.log('Menu popup did not appear after maximum attempts');
                resolve(false);
              }
            }
          }, 200);
        });
      }
    }, (results) => {
      if (results && results[0].result) {
        resolve();
      } else {
        reject('Failed to execute menu operations');
      }
    });
  });
  try {
    // 等待菜单操作完成
    await openMenuPromise;
    
    // 执行原有的数据获取代码
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        const metaTags = document.querySelectorAll('meta[property="og:image"]')
        let ogImageUrl = ''
        for (const meta of metaTags) {
          const content = meta.getAttribute('content')
          if (content && content.match(/https:\/\/avatars\.mds\.yandex\.net\/get-games\/.*\/default526x314/)) {
            ogImageUrl = content
            break
          }
        }

        const linkTags = document.querySelectorAll('link[rel="shortcut icon"]')
        let iconUrl = ''
        for (const link of linkTags) {
          const href = link.getAttribute('href')
          if (href && href.match(/https:\/\/avatars\.mds\.yandex\.net\/get-games\/.*\/size24/)) {
            iconUrl = href
            break
          }
        }
        let iconImg = document.querySelector('body > div.play-game-header-menu__popup-container.play-game-header-menu.popup-module__popup--mv7Tz.popup-module__visible--iwb3h.popup-module__withAnchor--nECOw > div.play-game-header-menu__menu-container > div > a > div.play-game-header-menu__game-icon-wrapper > img')
        if (!iconImg) {
          const alternativeIconImg = document.querySelector('#mount > div > div.app__container > div > div.stack > div.play-guard-dialog.play-guard-dialog_with-blur.play-guard-dialog_with-similar > div.play-guard-dialog__content.shake > div.play-guard-dialog__description > div.image.image_state_loaded.play-guard-dialog__description-icon > img')
          if (alternativeIconImg) {
            iconImg = alternativeIconImg
          }
        }
        const iconSrc = iconImg ? iconImg.src : '未找到图标'

        const gameFrame = document.querySelector('#game-frame')
        const gameSrc = gameFrame ? gameFrame.src : '未找到游戏框架'

        const gameTitle = document.querySelector('#mount > div > div.app__container > div > div.play-game-header.play-game-header_fullscreen-enabled.play-game-header_menu-enabled > span.play-game-header__info > span > a > span')

        const gameTitleText = gameTitle ? gameTitle.textContent : '未找到游戏标题'

        const gameTypeElement = document.querySelector('#mount > div > div.app__container > div > div.game-info > div > div.app-popup__content > div.game-page.game-page_without_feedback.game-page_with_player.centered-content > section > div.game-page__short-description-wrap > section > div.game-page__short-description-bottom > ul > li:nth-child(2) > span > a')
        const gameType = gameTypeElement ? gameTypeElement.textContent : '未找到游戏类型'

        const gameDescriptionElement = document.querySelector('#mount > div > div.app__container > div > div.game-info > div > div.app-popup__content > div.game-page.game-page_without_feedback.game-page_with_player.centered-content > div > div > section.game-page__instruction > section.game-description > div > span')
        const gameDescription = gameDescriptionElement ? gameDescriptionElement.textContent : '未找到游戏说明'
        return {
          iconSrc,
          gameSrc,
          gameTitleText,
          ogImageUrl,
          iconUrl,
          gameType,
          gameDescription
        }
      }
    }, (results) => {
      const resultDiv = document.getElementById('result')
      if (!results || !results[0].result) {
        resultDiv.innerHTML = '获取数据失败'
        return
      }

      resultDiv.innerHTML = ""
      const data = results[0].result

      if (!data.gameSrc.split('?')[0].includes('yandex.net')) {
        resultDiv.innerHTML = '<div style="color: red; font-weight: bold; padding: 1rem;">该游戏不符合要求，必须是Yandex游戏</div>'
        return
      }
      function sanitizeFileName(fileName) {
        return fileName.replace(/[\\/:*?"<>|]/g, '-');
    }
      resultDiv.innerHTML += `
          <div class="space-y-4 p-4 bg-white rounded shadow">
            <h1 class="text-xl font-bold">${sanitizeFileName(data.gameTitleText)}</h1>
            <div class="flex items-start gap-2">
              <span class="font-semibold text-gray-700 w-24  text-nowrap">icon地址:</span>
              <span class="text-gray-600 break-all">${data.iconUrl.replace('size24', 'size256')}</span>
              <img src="${data.iconUrl.replace('size24', 'size256')}" alt="icon" class="w-16 aspect-[1/1]">
            </div>
            <div class="flex items-start gap-2">
              <span class="font-semibold text-gray-700 w-24  text-nowrap">游戏类型:</span>
              <span class="text-gray-600 break-all">${data.gameType}</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="font-semibold text-gray-700 w-24  text-nowrap">banner地址:</span>
              <span class="text-gray-600 break-all">${data.ogImageUrl}</span>
              <img src="${data.ogImageUrl}" alt="banner" class="w-32 aspect-[512/314]">
            </div>
            <div class="flex items-start gap-2">
              <span class="font-semibold text-gray-700 w-24  text-nowrap">游戏地址:</span>
              <span class="text-gray-600 break-all">${data.gameSrc}</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="font-semibold text-gray-700 w-24  text-nowrap">游戏说明:</span>
              <span class="text-gray-600 break-all">${data.gameDescription}</span>
            </div>
          </div>
        `
    });
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('result').innerHTML = '操作失败：' + error;
  }
});



