//=============================== import API =================================
import { sleep } from 'k6';
import { error_check } from '../check/check.js';
import { scenario } from 'k6/execution';
import { register_ } from '../api/register_.js';
import { profile } from '../api/profile.js';
import { Attach_Insurance } from '../api/Attach_Insurance.js';
import { Attach_Medical_Cert } from '../api/Attach_Medical_Cert.js';
//============================================================================

const cid         = __ENV.cid         || "1";
const id          = __ENV.id          || "1";
const projectname = __ENV.projectname || "1";
const user        = __ENV.user        || "1";
const durationx   = __ENV.durationx   || "1";
const scenariox   = __ENV.scenariox   || "1";
const vusx        = Math.ceil(user / durationx);
let options;
if (scenariox == 1) {
    options = {
        insecureSkipTLSVerify: true,
        discardResponseBodies: false,
        scenarios: {
            contacts: {
                executor: 'per-vu-iterations',
                vus: vusx,
                iterations: durationx,
                maxDuration: '10m',
                gracefulStop: '120s',
            },
        },
    };
}
else if (scenariox == 2) {
    options = {
        insecureSkipTLSVerify: true,
        discardResponseBodies: false,
        vus: user,
        duration: durationx + 's',
        gracefulStop: '120s',
    };
}
else if (scenariox == 3) {
    options = {
        insecureSkipTLSVerify: true,
        discardResponseBodies: false,
        scenarios: {
            example_scenario: {
                executor: 'constant-arrival-rate',
                rate: vusx,
                timeUnit: '1s',
                preAllocatedVUs: user,
                duration: durationx + 's',
                gracefulStop: '120s',
            },
        },
    };
}
else {
    options = {
        insecureSkipTLSVerify: true,
        discardResponseBodies: true,
        scenarios: {
            contacts: {
                executor: 'per-vu-iterations',
                vus: vusx,
                iterations: durationx,
                maxDuration: '10m',
            },
        },
    };
}

export { options };
//============================================================================
export default function () {
    // ===== เรียกใช้ API (เปิด/ปิดตามต้องการ) =====
    // let response = register_(cid);
    // let response = profile();
    // let response = Attach_Insurance();
    let response = Attach_Medical_Cert();

    // ===== error_check ก่อน log =====
    error_check(response);

    // ===== Log ทุก request =====
    console.log(
        `[REQ] VU=${__VU} ITER=${__ITER} | ` +
        `status=${response.status} | ` +
        `duration=${response.timings.duration.toFixed(0)}ms | ` +
        `waiting=${response.timings.waiting.toFixed(0)}ms | ` +
        `url=${response.url}`
    );

    sleep(1);
}