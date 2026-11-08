import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
const base = process.env.M3_TEST_URL || 'http://127.0.0.1:17369';
const browser = await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const errors=[];
try {
  await mkdir('/tmp/m3-flex-qa',{recursive:true});
  for (const width of [344,768,1280]) {
    const context=await browser.newContext({viewport:{width,height:920},reducedMotion:'reduce'});
    await context.addInitScript(()=>{
      sessionStorage.setItem('coach-intro-seen-v1','1');
      sessionStorage.setItem('m3-v2-entrance-seen','1');
    });
    // These checks exercise UI/session state without spending provider credits.
    await context.route('**/*',async route=>{
      if(!route.request().url().startsWith(base)) return route.abort();
      return route.continue();
    });
    const page=await context.newPage();
    page.on('pageerror',e=>errors.push(String(e)));
    await page.goto(base+'/',{waitUntil:'networkidle'});
    await page.getByTestId('flex-clean-today').waitFor();
    assert.equal(await page.getByRole('navigation',{name:'Main'}).getByRole('link').count(),3);
    assert.equal(await page.getByTestId('flex-existing-tools').count(),0);
    await page.getByTestId('start-with-marcus').click();
    await page.getByTestId('flex-training').waitFor();
    await page.waitForTimeout(500);
    assert.equal(await page.locator('aside').isVisible(),false);
    await page.getByRole('button',{name:'Coach controls',exact:true}).click();
    assert.equal(await page.locator('aside').isVisible(),true);
    await page.locator('select').selectOption('pull-arms');
    await page.getByRole('button',{name:'Coach controls',exact:true}).click();
    await page.getByRole('button',{name:'Start workout',exact:true}).click();
    await page.waitForTimeout(250);
    assert.equal(await page.getByRole('button',{name:'Pause workout',exact:true}).count(),1);
    await page.getByRole('button',{name:'Complete set and advance',exact:true}).click();
    const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('m3-coach-v2-local-session-v1')));
    assert.equal(before.session.completedSetIds.length,1);
    await page.getByRole('button',{name:'Hologram display',exact:true}).click();
    assert.equal(await page.getByTestId('flex-training').getAttribute('data-display-mode'),'true');
    const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('m3-coach-v2-local-session-v1')));
    assert.equal(after.workoutId,before.workoutId);
    assert.equal(after.session.exerciseIndex,before.session.exerciseIndex);
    assert.deepEqual(after.session.completedSetIds,before.session.completedSetIds);
    await page.getByRole('button',{name:'Back to workout',exact:true}).click();
    await page.getByRole('button',{name:'Pause workout',exact:true}).click();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth+1),`No horizontal overflow at ${width}`);
    const stage=await page.getByTestId('marcus-workout-stage').boundingBox();
    assert.ok(stage.width >= (width===1280 ? 1150 : width-75),`Workout uses available width ${width}: ${stage.width}`);
    await page.screenshot({path:`/tmp/m3-flex-qa/workout-${width}.png`,fullPage:true});
    await page.reload({waitUntil:'networkidle'});
    const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem('m3-coach-v2-local-session-v1')));
    assert.equal(restored.workoutId,'pull-arms');
    assert.equal(restored.session.running,false);
    assert.equal(restored.session.completedSetIds.length,1);
    await page.goto(base+'/',{waitUntil:'networkidle'});
    await page.getByRole('button',{name:'Workout library and tools',exact:true}).click();
    await page.getByTestId('m3-unified-workout-picker').waitFor();
    await page.getByRole('button',{name:'Close workout library and tools',exact:true}).click();
    await page.screenshot({path:`/tmp/m3-flex-qa/today-${width}.png`,fullPage:true});
    await context.close();
    console.log(`PASS ${width}px: clean home, three tabs, workout controls, same-session display, pause, saved-set restore, library, no overflow`);
  }
  // First entry must preserve a direct display link rather than redirect home.
  const context=await browser.newContext();
  await context.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
  const page=await context.newPage();
  await page.goto(base+'/v2?display=1');
  await page.getByTestId('app-entry-tap').click();
  await page.getByTestId('app-entry-yes').click();
  await page.getByTestId('flex-training').waitFor();
  assert.ok(page.url().includes('/v2?display=1'));
  assert.equal(await page.getByTestId('flex-training').getAttribute('data-display-mode'),'true');
  console.log('PASS first-entry display deep link preserved');
  await context.close();
  assert.deepEqual(errors,[]);
} finally {await browser.close();}
