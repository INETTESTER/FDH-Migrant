import http from 'k6/http';
import { token } from './env.js';

export function Attach_Insurance() {
    const url = 'https://fdh-migrant-clone.inet.co.th/fwf_api/v1/attach/insurance';

    const formData = {
        fcode: 'F056901433964',
        cid: '',
        passport_no: '',
        racode: '',
        hcode: '00000',
        hn: '12345',
        ethnicity: '048',
        ins_code_plan: '05',
        ins_date: '2026-05-12',
        examination_id: 'bd620bbf-7149-4bd5-b32d-2f71bfa21819',
    };

    const params = {
        headers: {
            Authorization: 'Bearer ' + token,
        },
    };

    const response = http.post(url, formData, params);

    //console.log('Response body:', response.body);

    return response;
}