import http from 'k6/http';
import { token } from './env.js';

const medicalCertFile = http.file(
    open('../files/งานนำเสนอไม่มีชื่อ.pdf', 'b'),
    'medical_certificate_17348_Coco_251230.pdf',
    'application/pdf'
);

export function Attach_Medical_Cert() {
    const url = 'https://fdh-migrant-clone.inet.co.th/fwf_api/v1/attach/medical-cert';

    const formData = {
        fcode: 'F057434867639',
        cid: '',
        passport_no: '',
        racode: '',
        hcode: '00000',

        doctor_id: '01669',
        medical_exam_date: '2026-05-12',
        medical_type: '1',

        medical_cert_file: medicalCertFile,

        height: '165',
        weight: '55',
        skin_tone: '-',
        blood_pressure: '90/83',
        pulse_rate: '79',
        physical_condition: '-',

        tuberculosis: '1',
        leprosy: '1',
        filariasis: '1',
        syphilis: '1',
        addictive_substances: '1',
        alcoholism: '1',

        pregnancy: '',
        other: '',
        good_health: '',

        continuous_treatment: 'true',
        continuous_tuberculosis: 'true',
        continuous_leprosy: '',
        continuous_filariasis: '',
        continuous_syphilis: '',
        continuous_other: '',

        failed_health_examination: '',
        physical_disability: '',
        abnormal: '',
    };

    const params = {
        headers: {
            Authorization: 'Bearer ' + token,
        },
        timeout: '300s',
    };

    const response = http.post(url, formData, params);

    console.log('Response body:', response.body);

    return response;
}