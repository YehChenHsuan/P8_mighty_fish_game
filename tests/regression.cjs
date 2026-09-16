const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const audios = [], timers = new Map(); let tid=0, spoken=[];
class AudioMock {
  constructor(src) { this.src=src; this.paused=true; audios.push(this); }
  play() { this.paused=false; return Promise.resolve(); }
  pause() { this.paused=true; }
  removeAttribute() { this.src=''; }
  load() {}
}
const context = vm.createContext({ console, Audio:AudioMock,
  SpeechSynthesisUtterance:class { constructor(text) { this.text=text; } },
  setTimeout:fn=>{timers.set(++tid,fn);return tid;}, clearTimeout:id=>timers.delete(id),
  window:{ addEventListener(){}, speechSynthesis:{cancel(){},getVoices(){return [];},speak(u){spoken.push(u.text);}} }
});
for(const file of ['data','sentences_map','audio','game']) vm.runInContext(fs.readFileSync(`js/${file}.js`,'utf8'),context);
const sound=vm.runInContext('FishSound',context);
let count=0;
function test(name,fn){fn();console.log('PASS',name);count++;}
test('Every question and option has an existing exact audio mapping',()=>{
 for(const q of context.window.FISH_QUESTIONS) for(const text of [q.questionEn,...q.options]) {
   const path=context.window.SENTENCES_AUDIO_MAP[text]; assert.ok(path,text);assert.ok(fs.existsSync(path),path);
 }
});
test('Rapid replay and option playback leave only one live voice',()=>{
 for(let i=0;i<20;i++)sound.playQuestionAudio(context.window.FISH_QUESTIONS[i%context.window.FISH_QUESTIONS.length]);
 sound.speakOptionText(context.window.FISH_QUESTIONS[0].options[0]);assert.equal(audios.filter(a=>!a.paused).length,1);
});
test('Stopped audio cannot trigger stale callbacks',()=>{
 let called=0;sound.speakFullSentence(context.window.FISH_QUESTIONS[0].options[0],()=>called++);const old=audios.at(-1).onended;
 sound.playQuestionAudio(context.window.FISH_QUESTIONS[0]);old();assert.equal(called,0);
});
test('Error fallback reads the full question, not the answer',()=>{
 sound.playQuestionAudio(context.window.FISH_QUESTIONS[0]);audios.at(-1).onerror();
 assert.equal(spoken.at(-1),context.window.FISH_QUESTIONS[0].questionEn);assert.equal(audios.filter(a=>!a.paused).length,0);
});
test('Stop cancels file, browser voice and watchdog',()=>{
 sound.stopVoice();assert.equal(sound.voiceAudio,null);assert.equal(sound.utterance,null);assert.equal(timers.size,0);
});
test('Visible question takes precedence over mismatched speechText',()=>{
 assert.equal(sound.getQuestionSpeechSentence({questionEn:context.window.FISH_QUESTIONS[0].questionEn,speechText:'dummy'}),context.window.FISH_QUESTIONS[0].questionEn);
});
test('Muted playback creates no audio',()=>{
 const before=audios.length;sound.toggleMute();sound.playQuestionAudio(context.window.FISH_QUESTIONS[0]);assert.equal(audios.length,before);sound.toggleMute();
});
const game=vm.runInContext('new MightyFishGame()',context);let advanced=0,ended=0;
game.nextQuestion=()=>advanced++;game.triggerGameOver=()=>ended++;
test('Pause preserves pending question transition',()=>{
 game.gameState='PAUSED';game.transitionRemaining=0.5;game.updateTransition(2);assert.equal(game.transitionRemaining,0.5);assert.equal(advanced,0);
});
test('Resume completes pending transition exactly once',()=>{
 game.gameState='PLAYING';game.updateTransition(1);game.updateTransition(1);assert.equal(advanced,1);
});
test('Question waits for answer audio to end',()=>{
 game.transitionRemaining=0.1;sound.speakOptionText(context.window.FISH_QUESTIONS[0].options[0]);game.updateTransition(1);assert.equal(advanced,1);
 audios.at(-1).onended();game.updateTransition(0.1);assert.equal(advanced,2);
});
test('Last life ends after resume without advancing',()=>{
 game.lives=0;game.transitionRemaining=0.1;game.updateTransition(1);assert.equal(ended,1);assert.equal(advanced,2);
});
test('Hits while paused cannot change score or lives',()=>{
 game.gameState='PAUSED';game.isTransitioningQuestion=false;game.handleGateHit(false,{text:'dummy'});assert.equal(game.totalQuestionsAnswered,0);
});
test('Wrong answers stop narration and play only the warning sound',()=>{
 const g=vm.runInContext('new MightyFishGame()',context);
 g.gameState='PLAYING';g.updateHud=()=>{};g.showFeedbackBanner=()=>{};
 let warnings=0;const original=sound.playWrongSound;
 sound.playWrongSound=()=>warnings++;
 try {
  sound.playQuestionAudio(context.window.FISH_QUESTIONS[0]);
  const before=audios.length, beforeSpeech=spoken.length;
  g.handleGateHit(false,{text:context.window.FISH_QUESTIONS[0].options[1]});
  assert.equal(warnings,1);assert.equal(audios.length,before);
  assert.equal(spoken.length,beforeSpeech);assert.equal(sound.voiceAudio,null);
  assert.equal(audios.filter(a=>!a.paused).length,0);assert.equal(g.lives,4);
 } finally { sound.playWrongSound=original; }
});
test('Correct answers still narrate the selected answer',()=>{
 const g=vm.runInContext('new MightyFishGame()',context);
 g.gameState='PLAYING';g.updateHud=()=>{};g.showFeedbackBanner=()=>{};
 g.ocean={fish:{speed:1}};
 const correctOpt = context.window.FISH_QUESTIONS[0].correct;
 g.handleGateHit(true,{text:correctOpt});
 assert.equal(sound.voiceAudio.src,context.window.SENTENCES_AUDIO_MAP[correctOpt]);
 assert.equal(g.correctCount,1);assert.equal(g.lives,5);
 sound.stopVoice();
});
console.log(`${count} regression checks passed.`);
