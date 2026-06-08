import http from 'k6/http';
import { token } from './env.js';

const imageFile = http.file(
    open('../file/test.jpg', 'b'),
    'test.jpg',
    'image/jpeg'
);

export function register_(cid) {
    const url = `https://fdh-migrant-clone.inet.co.th/fwf_api/v1/bio_id/register`;
    const id = `${__VU}${__ITER}${cid}`;  // รันเลข id ด้วยเลข VU กับ ITER  เช่น 10,20,30

    const formData = {
        register_date: '2026-01-27',
        hcode: '00000',
        cid: ''+id,
        passport_no: '-',
        title: 'นาย',
        title_eng: 'Mr.',
        fname: 'เทส',
        fname_eng: 'Test',
        lname: 'เอ็ดเวิร์ด',
        lname_eng: 'Edward',
        gender: '1',
        date_of_birth: '2000-01-31',
        race: '056',
        address: '10/1',
        village_no: '10',
        lane: 'ขวา',
        road: 'มิตรภาพขอนแก่น-หนองคาย',
        province: 'ขอนแก่น',
        district: 'เมืองขอนแก่น',
        sub_district: 'ศิลา',
        postal_code: '40000',
        phone: '0800000000',
        occupation: 'BT03',
        employer_full_name: 'ทอง ดี',
        employer_phone: '0600000000',
        company: 'INET',

        front_1: imageFile,
        front_2: imageFile,
        front_3: imageFile,
        left_1: imageFile,
        right_1: imageFile,
    };

    const params = {
        headers: {
            Authorization: 'Bearer ' + token,
        },
        timeout: '300s',
    };

    const response = http.post(url, formData, params);

    //console.log('Response body:', response.body);

    return response;
}