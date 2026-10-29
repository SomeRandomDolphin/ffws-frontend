import {test} from 'node:test';
import assert from 'node:assert/strict';
import {previewHistory} from '../src/lib/preview-history.ts';
test('raw 30-minute window preserves spikes and zeros',()=>{
 const r=previewHistory([{time:0,value:9},{time:1800001,value:0},{time:1800002,value:100}],30);
 assert.deepEqual(r.points.map(p=>p.value),[0,100]);
});
test('six-hour window averages five minutes and preserves extrema and nulls',()=>{
 const r=previewHistory([{time:0,value:0},{time:1000,value:100},{time:2000,value:null},{time:3000,value:20}],360);
 assert.equal(r.interval,300000);
 assert.deepEqual(r.points.map(p=>p.value),[50,null,20]);
 assert.deepEqual(r.points[0].range,[0,100]);
});
test('empty input and 24-hour bucket width',()=>{
 assert.equal(previewHistory([],360).points.length,0);
 assert.equal(previewHistory([{time:0,value:1}],1440).interval,900000);
});
test('preaggregated medians keep values and source extrema at every view range',()=>{
 const points=[{time:0,value:2,range:[1,40]},{time:300000,value:8,range:[7,9]},{time:900000,value:null}];
 for(const minutes of [30,360,1440,10080]){
  const result=previewHistory(points,minutes,true);
  assert.equal(result.interval,300000);
  assert.deepEqual(result.points.filter(p=>p.value!==null).map(p=>p.value),[2,8]);
  assert.deepEqual(result.points[0].range,[1,40]);
  assert.equal(result.points.at(-1).value,null);
  assert.ok(result.points.some(p=>p.time===899999&&p.value===null));
 }
});
