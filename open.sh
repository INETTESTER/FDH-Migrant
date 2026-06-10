#!/bin/bash
##########################################################################
##########################################################################
##########################################################################
##########################################################################
##########################################################################
                     API="Attach_Medical_Cert"
                     google_sheet="https://docs.google.com/spreadsheets/d/15LCAQd7lMC4tVjWYIwk13IFjzns_2mUhQBProQ4O8jU/edit?gid=275026389#gid=275026389"
                     id="10"                #เปลี่ยน id ทุกครั้งที่ยิง
                     user="4000";           #จํานวนผู้ใช้งาน
                     duration="1";          #วินาที
                     scenario="1"           #scenario="1" ยิงเเบบกําหนด request (duration ได้แค่ 1 วินาที)
                     cid="1000"             #scenario="2" ยิงเเบบกําหนด VUs  (กําหนดว่า user x คน ใช้ระบบ x วินาที)
                                            #scenario="3" ยิงเเบบกําหนด request แต่ไม่แม่นยํา (duration กี่วินาทีก็ได้)
                     status="normal"        #พิมพ์คําว่า "normal" เพื่อยิงโหลดเเละ upload report ไปที่ sheet
                                            #พิมพ์คําว่า "report" upload report ล่าสุดไปที่ sheet
##########################################################################
##########################################################################
##########################################################################
##########################################################################
##########################################################################
folder_report=$(date +"%d-%m-%y") #ห้ามเปลี่ยน
if [ ! -d "report/$folder_report" ]; then
  mkdir "report/$folder_report"
fi
filenamex="$API-$user-$id"
if [ "$status" = "normal" ]; then
    # clear log และ report เก่าก่อนรันทุกครั้ง
    > k6.log
    > report/"$folder_report"/"$filenamex".json

    # รัน main/main.js และรอจนกว่าจะเสร็จ
    k6 run \
      --log-output=file=./k6.log \
      --env id="$id" \
      --env cid="$cid" \
      --env projectname="$API" \
      --env scenariox="$scenario" \
      --env user="$user" \
      --env durationx="$duration" \
      --summary-export=report/"$folder_report"/"$filenamex".json \
      main/main.js
    wait

    # ตรวจ exit code — ถ้า k6 พังให้หยุดทันที ไม่ upload
    if [ $? -ne 0 ]; then
      echo "❌ k6 run failed (exit code: $?) — ยกเลิก upload"
      exit 1
    fi

    # แสดง error summary เฉพาะรอบนี้
    echo ""
    echo "========== ERROR SUMMARY =========="
    grep -E "NETWORK ERROR|SERVER ERROR|CLIENT ERROR" k6.log | sort | uniq -c | sort -rn
    echo "==================================="
    echo ""

    # รัน insertdata.js
    if [ -f "report/$folder_report/$filenamex.json" ]; then
        echo "✨ Uploading report...."
        k6 run \
          --env filename="$filenamex" \
          --env projectname="$API" \
          --env date="$folder_report" \
          --env id="$id" \
          --env user="$user" \
          --env durationx="$duration" \
          --env google_link="$google_sheet" \
          gafana/insertdata.js --no-summary
    fi
elif [ "$status" = "report" ]; then
    if [ -f "report/$folder_report/$filenamex.json" ]; then
        echo "✨ Uploading report...."
        k6 run \
          --env filename="$filenamex" \
          --env projectname="$API" \
          --env date="$folder_report" \
          --env id="$id" \
          --env user="$user" \
          --env durationx="$duration" \
          --env google_link="$google_sheet" \
          gafana/insertdata.js --no-summary
    else
        echo "❌ Report not found"
    fi
else
    echo "❌ Invalid report value: $status"
fi