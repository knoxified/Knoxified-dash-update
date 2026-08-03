const fs = require('fs');
const file = '/app/applet/app/(dashboard)/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const target1 = `"use client";\nimport { useState, useEffect } from "react";\nimport { ArrowRight`;
const rep1 = `"use client";\nimport { ActivityFeed } from "@/components/ActivityFeed";\nimport { useState, useEffect } from "react";\nimport { ArrowRight`;

const target2Start = `<div className="p-2 overflow-y-auto max-h-[400px]">`;
const target2End = `</div>`;

if (content.includes(target1)) {
  content = content.replace(target1, rep1);
  console.log("Target 1 Patched");
} else {
  console.log("Target 1 not found");
}

let t2idx = content.indexOf(target2Start);
if (t2idx !== -1) {
  let innerStr = content.substring(t2idx);
  let divEnd = innerStr.indexOf(target2End, innerStr.indexOf(target2End) + 1); // Need to find the closing div of the parent
  // Actually, there are multiple divs inside.
  // Instead, replace from <div className="p-2 overflow-y-auto max-h-[400px]"> to the next {metrics.winsFeed ... ))} </div>
}
