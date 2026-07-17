const fs = require('fs');
let content = fs.readFileSync('app/campaigns/page.tsx', 'utf8');

// Add import
content = content.replace(
  'import { toast } from "sonner";',
  'import { toast } from "sonner";\nimport ScheduleManager from "@/components/ScheduleManager";'
);

// Add to JSX, right before the last </div>
const parts = content.split('</div>\n    </div>\n  );\n}');
if (parts.length === 2) {
    content = parts[0] + '</div>\n      <ScheduleManager type="call" targetId="global" />\n    </div>\n  );\n}';
} else {
    // try another match
    content = content.replace(
        /(\s*)\<\/div\>\s*\)\;\s*\}/,
        `\n      <ScheduleManager type="call" targetId="global" />$1</div>\n  );\n}`
    );
}

fs.writeFileSync('app/campaigns/page.tsx', content, 'utf8');
