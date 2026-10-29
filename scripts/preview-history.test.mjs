import {test} from 'node:test';
import assert from 'node:assert/strict';
import {previewHistory} from '../src/lib/preview-history.ts';
test('raw 30-minute window preserves spikes and zeros',()=>{
 const r=previewHistory([{time:0,value:9},{time:1800001,value:0},{time:1800002,value:100}],30);
 assert.deepEqual(r.points.map(p=>p.value),[0,100]);
});
test('summary retains extrema and separates nulls',()=>{
 const r=previewHistory([{time:0,value:0},{time:1000,value:100},{time:2000,value:null},{time:3000,value:20}],360);
 assert.equal(r.interval,300000);
 assert.deepEqual(r.points.map(p=>p.value),[50,null,20]);
 assert.deepEqual(r.points[0].range,[0,100]);
});
test('empty input and 24-hour bucket width',()=>{
 assert.equal(previewHistory([],360).points.length,0);
 assert.equal(previewHistory([{time:0,value:1}],1440).interval,900000);
});
