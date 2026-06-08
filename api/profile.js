import http from 'k6/http';
import { token } from './env.js';

export function profile() {
    const url = 'https://fdh-migrant-clone.inet.co.th/fwf_api/v1/profile';

    const payload = JSON.stringify({
        type: 'fcode',
        code: 'F048909237724',
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token,
        },
        timeout: '300s',
    };

    const response = http.post(url, payload, params);

    //console.log('Response body:', response.body);

    return response;
}