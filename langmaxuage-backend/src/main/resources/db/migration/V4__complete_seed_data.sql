-- =============================================================
-- Migration V4: Reseed high-quality multilingual data
-- =============================================================

BEGIN;

-- 1. Dọn dẹp dữ liệu cũ (chừa lại users và supported_locales)
TRUNCATE TABLE quiz_answers CASCADE;
TRUNCATE TABLE quiz_options CASCADE;
TRUNCATE TABLE user_progress CASCADE;
TRUNCATE TABLE quiz_attempts CASCADE;
TRUNCATE TABLE flashcard_translations CASCADE;
TRUNCATE TABLE topic_translations CASCADE;
TRUNCATE TABLE audit_logs CASCADE;
TRUNCATE TABLE flashcards CASCADE;
TRUNCATE TABLE topics CASCADE;

-- 2. Reset các sequences để ID bắt đầu từ 1
ALTER SEQUENCE topics_id_seq RESTART WITH 1;
ALTER SEQUENCE flashcards_id_seq RESTART WITH 1;
ALTER SEQUENCE topic_translations_id_seq RESTART WITH 1;
ALTER SEQUENCE flashcard_translations_id_seq RESTART WITH 1;
ALTER SEQUENCE quiz_options_id_seq RESTART WITH 1;
ALTER SEQUENCE user_progress_id_seq RESTART WITH 1;
ALTER SEQUENCE quiz_attempts_id_seq RESTART WITH 1;
ALTER SEQUENCE quiz_answers_id_seq RESTART WITH 1;
ALTER SEQUENCE audit_logs_id_seq RESTART WITH 1;

-- 3. Chèn 9 Topic hệ thống (tiếng Anh làm gốc)
-- display_order: 1 tới 9, is_system = true, created_by = 1 (admin_main)
INSERT INTO topics (id, name, description, display_order, is_system, created_by)
VALUES
    (1, 'Office Life', 'Daily activities, tasks, and communications in a professional office environment.', 1, TRUE, 1),
    (2, 'Business Trip', 'Travel arrangements, ticket booking, itineraries, and accommodations for work.', 2, TRUE, 1),
    (3, 'Healthcare', 'Medical terms, hospital visits, diagnoses, prescriptions, and health management.', 3, TRUE, 1),
    (4, 'Shopping & Retail', 'Retail transactions, inventory, receipt management, customer support, and sales.', 4, TRUE, 1),
    (5, 'Grammar: Tenses', 'Mastery of all 12 English tenses, conjugations, timelines, and auxiliary structures.', 5, TRUE, 1),
    (6, 'Grammar: Passive Voice', 'Formal sentence structures where the action receives primary focus, essential for TOEIC writing.', 6, TRUE, 1),
    (7, 'Technology & IT', 'Software, hardware, network administration, cyber security, and technological innovation.', 7, TRUE, 1),
    (8, 'Banking & Finance', 'Monetary systems, transactions, loans, interest, investments, capital, and corporate audits.', 8, TRUE, 1),
    (9, 'Eating Out', 'Restaurants, cuisines, reservations, menus, beverages, and exceptional dining service.', 9, TRUE, 1);

-- Thiết lập lại sequence cho topics sau khi chèn bằng ID thủ công
SELECT setval('topics_id_seq', (SELECT MAX(id) FROM topics));

-- 4. Chèn Topic Translations cho vi, ja, ko
INSERT INTO topic_translations (topic_id, locale, name, description)
VALUES
    -- Topic 1: Office Life
    (1, 'vi', 'Đời sống công sở', 'Các hoạt động, nhiệm vụ và giao tiếp hàng ngày trong môi trường văn phòng chuyên nghiệp.'),
    (1, 'ja', 'オフィスライフ', 'プロフェッショナルなオフィス環境での日常業務、タスク、およびコミュニケーション。'),
    (1, 'ko', '회사 생활', '전문적인 사무실 환경에서의 일상 업무, 과제 및 커뮤니케이션.'),

    -- Topic 2: Business Trip
    (2, 'vi', 'Chuyến công tác', 'Sắp xếp chuyến đi, đặt vé, lịch trình và chỗ lưu trú phục vụ công việc.'),
    (2, 'ja', '出張', '仕事のための旅行の手配、チケットの予約、旅程、および宿泊施設。'),
    (2, 'ko', '출장', '업무를 위한 여행 일정 계획, 항공권 예약, 여정 및 숙박 시설.'),

    -- Topic 3: Healthcare
    (3, 'vi', 'Chăm sóc sức khỏe', 'Thuật ngữ y tế, thăm khám bệnh viện, chẩn đoán, đơn thuốc và quản lý sức khỏe.'),
    (3, 'ja', 'ヘルスケア', '医療用語、病院訪問、診断、処方箋、および健康管理。'),
    (3, 'ko', '의료 및 건강', '의료 용어, 병원 방문, 진단, 처방전 및 건강 관리.'),

    -- Topic 4: Shopping & Retail
    (4, 'vi', 'Mua sắm & Bán lẻ', 'Giao dịch bán lẻ, hàng tồn kho, quản lý hóa đơn, hỗ trợ khách hàng và bán hàng.'),
    (4, 'ja', 'ショッピング＆小売', '小売取引、在庫、レシート管理、顧客サポート、および販売。'),
    (4, 'ko', '쇼핑 및 소매', '소매 거래, 재고, 영수증 관리, 고객 지원 및 판매.'),

    -- Topic 5: Grammar: Tenses
    (5, 'vi', 'Ngữ pháp: Các thì', 'Làm chủ toàn bộ 12 thì trong tiếng Anh, cách chia động từ, trục thời gian và cấu trúc trợ động từ.'),
    (5, 'ja', '文法：時制', '英語の12の時制、動詞の活用、タイムライン、および助動詞構造の習得。'),
    (5, 'ko', '문법: 시제', '영어의 12가지 시제, 동사 변형, 시간선 및 조동사 구조의 완벽 습득.'),

    -- Topic 6: Grammar: Passive Voice
    (6, 'vi', 'Ngữ pháp: Thể bị động', 'Cấu trúc câu trang trọng nhấn mạnh vào hành động, phần quan trọng trong viết TOEIC.'),
    (6, 'ja', '文法：受動態', '行動が主な焦点となるフォーマルな文構造。TOEICライティングに不可欠。'),
    (6, 'ko', '문법: 수동태', '행위에 초점이 맞춰진 격식 있는 문장 구조. TOEIC 쓰기에 필수적임.'),

    -- Topic 7: Technology & IT
    (7, 'vi', 'Công nghệ & CNTT', 'Phần mềm, phần cứng, quản trị mạng, an toàn thông tin và đổi mới công nghệ.'),
    (7, 'ja', 'テクノロジー＆IT', 'ソフトウェア、ハードウェア、ネットワーク管理、サイバーセキュリティ、および技術革新。'),
    (7, 'ko', '기술 및 IT', '소프트웨어, 하드웨어, 네트워크 관리, 정보 보안 및 기술 혁신.'),

    -- Topic 8: Banking & Finance
    (8, 'vi', 'Tài chính & Ngân hàng', 'Hệ thống tiền tệ, giao dịch, khoản vay, lãi suất, đầu tư, nguồn vốn và kiểm toán doanh nghiệp.'),
    (8, 'ja', '銀行＆金融', '通貨制度、取引、ローン、利子、投資、資本、および企業監査。'),
    (8, 'ko', '금융 및 은행', '통화 시스템, 거래, 대출, 이자, 투자, 자본 및 기업 감사.'),

    -- Topic 9: Eating Out
    (9, 'vi', 'Ăn uống bên ngoài', 'Nhà hàng, phong cách ẩm thực, đặt bàn trước, thực đơn, đồ uống và dịch vụ ăn uống xuất sắc.'),
    (9, 'ja', '外食', 'レストラン、料理スタイル、予約、メニュー、飲料、および優れた飲食サービス。'),
    (9, 'ko', '외식', '식당, 요리 스타일, 예약, 메뉴판, 음료 및 우수한 식사 서비스.');

-- 5. Chèn 63 Flashcards hệ thống (tiếng Anh)
INSERT INTO flashcards (id, topic_id, created_by, word, pronunciation, definition, example_sentence, difficulty)
VALUES
    -- Topic 1: Office Life (1-7)
    (1, 1, 1, 'Collaborate', '/kəˈlæbəreɪt/', 'To work together with others to achieve a common goal.', 'We need to collaborate on this report to finish it by tomorrow.', 'MEDIUM'),
    (2, 1, 1, 'Postpone', '/poʊstˈpoʊn/', 'To delay an event or action until a later time.', 'The manager decided to postpone the staff meeting until next Monday.', 'EASY'),
    (3, 1, 1, 'Deadline', '/ˈdedlaɪn/', 'The latest time or date by which something must be completed.', 'The deadline for submitting the budget proposal is Friday afternoon.', 'MEDIUM'),
    (4, 1, 1, 'Delegate', '/ˈdelɪɡeɪt/', 'To entrust a task or responsibility to another person.', 'An effective leader knows how to delegate tasks to team members.', 'MEDIUM'),
    (5, 1, 1, 'Agenda', '/əˈdʒendə/', 'A list of items to be discussed at a formal meeting.', 'Please review the meeting agenda before we start the discussion.', 'EASY'),
    (6, 1, 1, 'Resign', '/rɪˈzaɪn/', 'To voluntarily leave a job or official position.', 'She plans to resign from her position to pursue higher education.', 'MEDIUM'),
    (7, 1, 1, 'Supervise', '/ˈsuːpərvaɪz/', 'To observe and direct the execution of a task or activity.', 'His primary role is to supervise the daily activities of the factory workers.', 'MEDIUM'),

    -- Topic 2: Business Trip (8-14)
    (8, 2, 1, 'Itinerary', '/aɪˈtɪnəreri/', 'A planned route or detailed journey.', 'I will send you a copy of the travel itinerary once the flights are confirmed.', 'HARD'),
    (9, 2, 1, 'Reimburse', '/ˌriːɪmˈbɜːrs/', 'To repay a person who has spent money for official business.', 'The company will reimburse all reasonable travel expenses.', 'HARD'),
    (10, 2, 1, 'Accommodation', '/əˌkɑːməˈdeɪʃn/', 'A room or group of rooms in which someone may live or stay.', 'We need to find hotel accommodation close to the convention center.', 'MEDIUM'),
    (11, 2, 1, 'Boarding', '/ˈbɔːrdɪŋ/', 'The act of entering a ship, aircraft, or other vehicle.', 'Boarding for flight VN123 will begin in approximately twenty minutes.', 'EASY'),
    (12, 2, 1, 'Conference', '/ˈkɑːnfərəns/', 'A formal meeting for discussion or exchange of information.', 'Many industry experts will attend the annual business conference next month.', 'EASY'),
    (13, 2, 1, 'Destination', '/ˌdestɪˈneɪʃn/', 'The place to which someone or something is going.', 'Our final destination for this business trip is Singapore.', 'EASY'),
    (14, 2, 1, 'Confirm', '/kənˈfɜːrm/', 'To establish the truth or correctness of something.', 'Please call the hotel to confirm our reservation details.', 'EASY'),

    -- Topic 3: Healthcare (15-21)
    (15, 3, 1, 'Prescription', '/prɪˈskrɪpʃn/', 'An instruction written by a medical practitioner authorizing a medicine.', 'You can buy this medicine only with a doctor''s prescription.', 'MEDIUM'),
    (16, 3, 1, 'Symptom', '/ˈsɪmptəm/', 'A physical or mental feature indicating a condition of disease.', 'A high fever is a common symptom of the flu.', 'EASY'),
    (17, 3, 1, 'Diagnose', '/ˌdaɪəɡˈnoʊz/', 'To identify the nature of an illness by examination.', 'The doctor was able to diagnose the illness after a blood test.', 'HARD'),
    (18, 3, 1, 'Treatment', '/ˈtiːtmənt/', 'Medical care given to a patient for an illness or injury.', 'Physical therapy is an effective treatment for back pain.', 'EASY'),
    (19, 3, 1, 'Physician', '/fɪˈzɪʃn/', 'A person qualified to practice medicine, especially a doctor.', 'She decided to consult a specialist physician about her heart condition.', 'MEDIUM'),
    (20, 3, 1, 'Appointment', '/əˈpɔɪntmənt/', 'An arrangement to meet someone at a particular time and place.', 'I have an appointment with the dentist at 3 PM tomorrow.', 'EASY'),
    (21, 3, 1, 'Clinic', '/ˈklɪnɪk/', 'An establishment where outpatients are given medical treatment.', 'The local health clinic is open from Monday to Saturday.', 'EASY'),

    -- Topic 4: Shopping & Retail (22-28)
    (22, 4, 1, 'Refund', '/ˈriːfʌnd/', 'A repayment of a sum of money to a customer.', 'You can get a full refund within 30 days of purchase.', 'EASY'),
    (23, 4, 1, 'Receipt', '/rɪˈsiːt/', 'A written statement confirming that money has been received.', 'Please keep your receipt as proof of purchase.', 'EASY'),
    (24, 4, 1, 'Discount', '/ˈdɪskaʊnt/', 'A deduction from the usual cost of something.', 'Members are entitled to a ten percent discount on all items.', 'EASY'),
    (25, 4, 1, 'Inventory', '/ˈɪnvəntɔːri/', 'A complete list of items or goods in stock.', 'The store closed early today for the annual inventory count.', 'MEDIUM'),
    (26, 4, 1, 'Purchase', '/ˈpɜːrtʃəs/', 'The act of buying something.', 'She made a major purchase of new office equipment yesterday.', 'EASY'),
    (27, 4, 1, 'Wholesale', '/ˈhoʊlseɪl/', 'The selling of goods in large quantities at lower prices.', 'The merchant sells wholesale products to smaller convenience stores.', 'HARD'),
    (28, 4, 1, 'Customer', '/ˈkʌstəmər/', 'A person who buys goods or services from a business.', 'Excellent service is the key to maintaining customer loyalty.', 'EASY'),

    -- Topic 5: Grammar: Tenses (29-35)
    (29, 5, 1, 'Present', '/ˈpreznt/', 'The tense used to describe actions happening right now.', 'We use the present simple to describe habits and routines.', 'EASY'),
    (30, 5, 1, 'Future', '/ˈfjuːtʃər/', 'The tense used to express events that will happen later.', 'The future perfect indicates an action that will be completed in the future.', 'EASY'),
    (31, 5, 1, 'Perfect', '/ˈpɜːrfɪkt/', 'The tense representing completed actions in relation to another time.', 'The present perfect tense connects past events with the present.', 'MEDIUM'),
    (32, 5, 1, 'Continuous', '/kənˈtɪnjuəs/', 'The tense representing ongoing actions over a period of time.', 'The past continuous is used to describe an action in progress in the past.', 'MEDIUM'),
    (33, 5, 1, 'Timeline', '/ˈtaɪmlaɪn/', 'A graphic representation of a passage of time as a line.', 'Drawing a timeline helps students visualize when actions occur.', 'EASY'),
    (34, 5, 1, 'Auxiliary', '/ɔːɡˈzɪliəri/', 'A helping verb used in forming tenses or moods.', 'In the present perfect, ''have'' acts as an auxiliary verb.', 'HARD'),
    (35, 5, 1, 'Conjugate', '/ˈkɑːndʒʊɡeɪt/', 'To give the different forms of a verb in grammar study.', 'Students must learn how to conjugate irregular verbs in English.', 'HARD'),

    -- Topic 6: Grammar: Passive Voice (36-42)
    (36, 6, 1, 'Passive', '/ˈpæsɪv/', 'The voice where the subject receives the action of the verb.', 'The passive voice is often used in official reports.', 'MEDIUM'),
    (37, 6, 1, 'Active', '/ˈæktɪv/', 'The voice where the subject performs the action.', 'It is usually clearer to write in the active voice.', 'EASY'),
    (38, 6, 1, 'Subject', '/ˈsʌbdʒɪkt/', 'The person or thing that performs or receives the action.', 'In a passive sentence, the object becomes the subject.', 'EASY'),
    (39, 6, 1, 'Agent', '/ˈeɪdʒənt/', 'The person or thing performing the action in a passive sentence.', 'The agent can be omitted if it is obvious or unimportant.', 'MEDIUM'),
    (40, 6, 1, 'Participle', '/ˈpɑːrtɪsɪpl/', 'A word formed from a verb and used to form compound tenses.', 'Passive sentences are formed using a form of ''be'' and a past participle.', 'HARD'),
    (41, 6, 1, 'Structure', '/ˈstrʌktʃər/', 'The arrangement of relations between parts of a sentence.', 'Understanding the structure of passive sentences is essential for the test.', 'EASY'),
    (42, 6, 1, 'Emphasize', '/ˈemfəsaɪz/', 'To give special importance or value to something in writing.', 'We use the passive voice to emphasize the action rather than the doer.', 'MEDIUM'),

    -- Topic 7: Technology & IT (43-49)
    (43, 7, 1, 'Encryption', '/ɪnˈkrɪpʃn/', 'The process of converting data into a code to prevent unauthorized access.', 'Data encryption is vital for online financial transactions.', 'HARD'),
    (44, 7, 1, 'Software', '/ˈsɔːftwer/', 'The programs and other operating information used by a computer.', 'We need to install the latest software updates for security reasons.', 'EASY'),
    (45, 7, 1, 'Database', '/ˈdeɪtəbeɪs/', 'A structured set of data held in a computer.', 'All customer records are stored securely in our central database.', 'MEDIUM'),
    (46, 7, 1, 'Network', '/ˈnetwɜːrk/', 'A group of two or more computer systems linked together.', 'The IT team is working to restore our local area network.', 'EASY'),
    (47, 7, 1, 'Innovation', '/ˌɪnəˈveɪʃn/', 'The action or process of innovating a new method or product.', 'Technological innovation drives the growth of modern businesses.', 'MEDIUM'),
    (48, 7, 1, 'Interface', '/ˈɪntərfeɪs/', 'A device or program enabling a user to communicate with a computer.', 'The application has a user-friendly interface that is easy to navigate.', 'MEDIUM'),
    (49, 7, 1, 'System', '/ˈsɪstəm/', 'A set of computer equipment working together.', 'We are replacing our old computer system with a modern cloud platform.', 'EASY'),

    -- Topic 8: Banking & Finance (50-56)
    (50, 8, 1, 'Mortgage', '/ˈmɔːrɡɪdʒ/', 'A loan to purchase a home or property.', 'They took out a 30-year mortgage to buy their first home.', 'HARD'),
    (51, 8, 1, 'Transaction', '/trænˈzækʃn/', 'An instance of buying or selling something.', 'The online transaction was completed in just a few seconds.', 'MEDIUM'),
    (52, 8, 1, 'Interest', '/ˈɪntrəst/', 'Money paid regularly at a particular rate for the use of money lent.', 'High-interest savings accounts offer a better return on investment.', 'EASY'),
    (53, 8, 1, 'Audit', '/ˈɔːdɪt/', 'An official inspection of financial accounts.', 'The financial records of the company undergo an independent audit every year.', 'HARD'),
    (54, 8, 1, 'Investment', '/ɪnˈvestmənt/', 'The action of investing money for financial return.', 'Investing in stock markets carries a certain level of risk.', 'MEDIUM'),
    (55, 8, 1, 'Bankruptcy', '/ˈbæŋkrʌptsi/', 'The state of being legally declared unable to pay debts.', 'The company declared bankruptcy after failing to recover from losses.', 'HARD'),
    (56, 8, 1, 'Capital', '/ˈkæpɪtl/', 'Wealth in the form of money or assets owned by an organization.', 'The startup raised enough capital to fund their product development.', 'MEDIUM'),

    -- Topic 9: Eating Out (57-63)
    (57, 9, 1, 'Cuisine', '/kwɪˈziːn/', 'A style or method of cooking characteristic of a country.', 'The restaurant specializes in traditional French cuisine.', 'EASY'),
    (58, 9, 1, 'Beverage', '/ˈbevərɪdʒ/', 'A drink, especially one other than water.', 'A complimentary beverage is served with every lunch special.', 'EASY'),
    (59, 9, 1, 'Appetizer', '/ˈæpɪtaɪzər/', 'A small dish taken before a meal to stimulate appetite.', 'We ordered a plate of garlic bread as an appetizer.', 'EASY'),
    (60, 9, 1, 'Reservation', '/ˌrezərˈveɪʃn/', 'An arrangement to secure a table or room in advance.', 'It is recommended to make a reservation on weekend nights.', 'EASY'),
    (61, 9, 1, 'Menu', '/ˈmenjuː/', 'A list of dishes available in a restaurant.', 'Our server handed us the dessert menu after we finished our main course.', 'EASY'),
    (62, 9, 1, 'Gourmet', '/ˈɡʊrmeɪ/', 'High-quality or exotic food, or a person who appreciates it.', 'The city is famous for its gourmet food markets.', 'HARD'),
    (63, 9, 1, 'Service', '/ˈsɜːrvɪs/', 'The action of helping or doing work for someone in a dining setting.', 'The food was delicious and the service was exceptionally fast.', 'EASY');

-- Thiết lập lại sequence cho flashcards sau khi chèn bằng ID thủ công
SELECT setval('flashcards_id_seq', (SELECT MAX(id) FROM flashcards));

-- 6. Chèn Flashcard Translations cho vi, ja, ko
-- Tiếng Việt (vi)
INSERT INTO flashcard_translations (flashcard_id, locale, definition, example_sentence, created_by)
VALUES
    -- Topic 1 (1-7)
    (1, 'vi', 'Cộng tác, hợp tác cùng nhau để đạt mục tiêu chung.', 'Chúng ta cần hợp tác làm báo cáo này để hoàn thành trước ngày mai.', 1),
    (2, 'vi', 'Trì hoãn, hoãn lại một sự kiện hoặc hoạt động.', 'Trưởng phòng quyết định hoãn cuộc họp nhân viên đến thứ Hai tuần tới.', 1),
    (3, 'vi', 'Hạn chót để hoàn thành một nhiệm vụ hoặc công việc.', 'Hạn chót để nộp đề xuất ngân sách là chiều thứ Sáu.', 1),
    (4, 'vi', 'Ủy thác nhiệm vụ hoặc trách nhiệm cho người khác.', 'Một nhà lãnh đạo hiệu quả biết cách giao việc cho các thành viên trong nhóm.', 1),
    (5, 'vi', 'Chương trình nghị sự, nội dung cuộc họp.', 'Vui lòng xem lại nội dung cuộc họp trước khi chúng ta bắt đầu thảo luận.', 1),
    (6, 'vi', 'Từ chức, thôi việc.', 'Cô ấy có kế hoạch xin thôi việc để tiếp tục học cao học.', 1),
    (7, 'vi', 'Giám sát và chỉ đạo việc thực hiện một công việc.', 'Vai trò chính của anh ấy là giám sát các hoạt động hàng ngày của công nhân nhà máy.', 1),
    -- Topic 2 (8-14)
    (8, 'vi', 'Lịch trình chuyến đi được lên kế hoạch trước.', 'Tôi sẽ gửi cho bạn một bản sao lịch trình chuyến đi sau khi chuyến bay được xác nhận.', 1),
    (9, 'vi', 'Hoàn lại tiền, bồi hoàn các chi phí đã chi.', 'Công ty sẽ bồi hoàn toàn bộ chi phí đi lại hợp lý.', 1),
    (10, 'vi', 'Chỗ ở, chỗ lưu trú (khách sạn, phòng ngủ).', 'Chúng ta cần tìm chỗ lưu trú khách sạn gần trung tâm hội nghị.', 1),
    (11, 'vi', 'Hành động lên tàu, máy bay hoặc các phương tiện khác.', 'Việc lên máy bay cho chuyến bay VN123 sẽ bắt đầu trong khoảng hai mươi phút nữa.', 1),
    (12, 'vi', 'Hội nghị chính thức phục vụ thảo luận hoặc trao đổi thông tin.', 'Nhiều chuyên gia trong ngành sẽ tham dự hội nghị kinh doanh thường niên vào tháng tới.', 1),
    (13, 'vi', 'Điểm đến, nơi mà ai đó đang đi tới.', 'Điểm đến cuối cùng của chuyến công tác này của chúng tôi là Singapore.', 1),
    (14, 'vi', 'Xác nhận tính chính xác hoặc sự thật của một điều gì đó.', 'Vui lòng gọi cho khách sạn để xác nhận chi tiết đặt phòng của chúng tôi.', 1),
    -- Topic 3 (15-21)
    (15, 'vi', 'Đơn thuốc được bác sĩ kê để mua dược phẩm.', 'Bạn chỉ có thể mua loại thuốc này khi có đơn thuốc của bác sĩ.', 1),
    (16, 'vi', 'Triệu chứng (thể chất hoặc tinh thần) biểu hiện của bệnh.', 'Sốt cao là một triệu chứng phổ biến của bệnh cúm.', 1),
    (17, 'vi', 'Chẩn đoán bệnh thông qua thăm khám và xét nghiệm.', 'Bác sĩ đã có thể chẩn đoán bệnh sau khi thử máu.', 1),
    (18, 'vi', 'Phương pháp hoặc liệu trình điều trị y tế.', 'Vật lý trị liệu là một phương pháp điều trị hiệu quả cho chứng đau lưng.', 1),
    (19, 'vi', 'Bác sĩ điều trị chuyên khoa.', 'Cô ấy quyết định tham khảo ý kiến của một bác sĩ chuyên khoa về tình trạng tim của mình.', 1),
    (20, 'vi', 'Cuộc hẹn đã được thu xếp trước về thời gian và địa điểm.', 'Tôi có cuộc hẹn với nha sĩ vào lúc 3 giờ chiều mai.', 1),
    (21, 'vi', 'Phòng khám y tế.', 'Phòng khám y tế địa phương mở cửa từ thứ Hai đến thứ Bảy.', 1),
    -- Topic 4 (22-28)
    (22, 'vi', 'Hoàn trả lại tiền (thường do khách hàng không hài lòng).', 'Bạn có thể được hoàn tiền đầy đủ trong vòng 30 ngày kể từ ngày mua.', 1),
    (23, 'vi', 'Biên lai, hóa đơn xác nhận đã nhận tiền.', 'Vui lòng giữ hóa đơn của bạn để làm bằng chứng mua hàng.', 1),
    (24, 'vi', 'Khoản giảm giá, chiết khấu so với giá thông thường.', 'Thành viên được giảm giá mười phần trăm cho tất cả các mặt hàng.', 1),
    (25, 'vi', 'Hàng tồn kho, sự kiểm kê hàng hóa trong kho.', 'Cửa hàng đóng cửa sớm hôm nay để kiểm kê hàng tồn kho hàng năm.', 1),
    (26, 'vi', 'Hành động mua sắm, giao dịch mua hàng.', 'Hôm qua cô ấy đã mua một lượng lớn thiết bị văn phòng mới.', 1),
    (27, 'vi', 'Bán buôn, bán sỉ với số lượng lớn và giá ưu đãi.', 'Thương nhân bán buôn các sản phẩm cho các cửa hàng tiện lợi nhỏ hơn.', 1),
    (28, 'vi', 'Khách hàng, người hoặc tổ chức mua hàng hóa, dịch vụ.', 'Dịch vụ xuất sắc là chìa khóa để duy trì sự trung thành của khách hàng.', 1),
    -- Topic 5 (29-35)
    (29, 'vi', 'Thì hiện tại dùng mô tả sự việc đang xảy ra.', 'Chúng ta dùng thì hiện tại đơn để tả thói quen và lịch trình.', 1),
    (30, 'vi', 'Thì tương lai dùng mô tả sự việc sẽ xảy ra.', 'Thì tương lai hoàn thành chỉ một hành động sẽ được hoàn thành trong tương lai.', 1),
    (31, 'vi', 'Thì hoàn thành dùng diễn tả hành động đã kết thúc liên quan thời điểm khác.', 'Thì hiện tại hoàn thành kết nối các sự kiện trong quá khứ với hiện tại.', 1),
    (32, 'vi', 'Thì tiếp diễn dùng diễn tả hành động đang tiếp tục kéo dài.', 'Thì quá khứ tiếp diễn được dùng để tả một hành động đang diễn ra trong quá khứ.', 1),
    (33, 'vi', 'Trục thời gian, sự thể hiện thời gian bằng hình ảnh.', 'Vẽ trục thời gian giúp học sinh hình dung thời điểm các hành động xảy ra.', 1),
    (34, 'vi', 'Trợ động từ dùng bổ nghĩa và cấu tạo thì hoặc thể.', 'Trong thì hiện tại hoàn thành, ''have'' đóng vai trò là một trợ động từ.', 1),
    (35, 'vi', 'Chia động từ, biến đổi hình thái động từ theo ngữ pháp.', 'Học sinh phải học cách chia các động từ bất quy tắc trong tiếng Anh.', 1),
    -- Topic 6 (36-42)
    (36, 'vi', 'Thể bị động, nơi chủ ngữ nhận tác động của hành động.', 'Thể bị động thường được sử dụng trong các báo cáo chính thức.', 1),
    (37, 'vi', 'Thể chủ động, nơi chủ ngữ trực tiếp thực hiện hành động.', 'Thường thì viết ở thể chủ động sẽ rõ ràng hơn.', 1),
    (38, 'vi', 'Chủ ngữ trong câu thực hiện hoặc nhận hành động.', 'Trong câu bị động, tân ngữ trở thành chủ ngữ.', 1),
    (39, 'vi', 'Tác nhân gây hành động trong câu bị động (thường sau ''by'').', 'Tác nhân có thể được lược bỏ nếu nó đã rõ ràng hoặc không quan trọng.', 1),
    (40, 'vi', 'Phân từ (đặc biệt là Quá khứ phân từ V3 để cấu tạo câu bị động).', 'Các câu bị động được cấu tạo bằng dạng của động từ ''be'' và quá khứ phân từ.', 1),
    (41, 'vi', 'Cấu trúc câu, sự sắp xếp mối quan hệ các thành phần.', 'Hiểu cấu trúc của câu bị động là điều cần thiết cho bài kiểm tra.', 1),
    (42, 'vi', 'Nhấn mạnh, làm nổi bật tầm quan trọng của điều gì đó.', 'Chúng ta dùng thể bị động để nhấn mạnh hành động hơn là người thực hiện.', 1),
    -- Topic 7 (43-49)
    (43, 'vi', 'Mã hóa thông tin nhằm tránh truy cập trái phép.', 'Mã hóa dữ liệu là cực kỳ quan trọng đối với các giao dịch tài chính trực tuyến.', 1),
    (44, 'vi', 'Phần mềm máy tính, các chương trình vận hành.', 'Chúng ta cần cài đặt các bản cập nhật phần mềm mới nhất vì lý do bảo mật.', 1),
    (45, 'vi', 'Cơ sở dữ liệu được tổ chức có cấu trúc trên máy tính.', 'Tất cả hồ sơ khách hàng được lưu trữ an toàn trong cơ sở dữ liệu trung tâm của chúng tôi.', 1),
    (46, 'vi', 'Mạng máy tính kết nối hai hoặc nhiều máy tính.', 'Nhóm CNTT đang làm việc để khôi phục mạng nội bộ của chúng tôi.', 1),
    (47, 'vi', 'Sự đổi mới, sáng tạo phương pháp hoặc sản phẩm mới.', 'Đổi mới công nghệ thúc đẩy sự phát triển của các doanh nghiệp hiện đại.', 1),
    (48, 'vi', 'Giao diện tương tác giữa người dùng và máy tính.', 'Ứng dụng có giao diện thân thiện với người dùng và dễ điều hướng.', 1),
    (49, 'vi', 'Hệ thống thiết bị máy tính vận hành cùng nhau.', 'Chúng tôi đang thay thế hệ thống máy tính cũ bằng một nền tảng đám mây hiện đại.', 1),
    -- Topic 8 (50-56)
    (50, 'vi', 'Khoản vay thế chấp bằng tài sản để mua nhà đất.', 'Họ đã vay thế chấp 30 năm để mua ngôi nhà đầu tiên của mình.', 1),
    (51, 'vi', 'Giao dịch mua bán hoặc thỏa thuận kinh doanh.', 'Giao dịch trực tuyến được hoàn thành chỉ trong vài giây.', 1),
    (52, 'vi', 'Lãi suất, tiền lãi trả cho việc sử dụng tiền vay.', 'Các tài khoản tiết kiệm có lãi suất cao mang lại lợi tức đầu tư tốt hơn.', 1),
    (53, 'vi', 'Kiểm toán, sự thanh tra chính thức tài chính kế toán.', 'Hồ sơ tài chính của công ty trải qua một cuộc kiểm toán độc lập hàng năm.', 1),
    (54, 'vi', 'Khoản đầu tư tiền bạc nhằm sinh lợi nhuận.', 'Đầu tư vào thị trường chứng khoán mang lại một mức độ rủi ro nhất định.', 1),
    (55, 'vi', 'Tình trạng phá sản, mất khả năng thanh toán nợ hợp pháp.', 'Công ty đã tuyên bố phá sản sau khi không thể phục hồi từ các khoản lỗ.', 1),
    (56, 'vi', 'Nguồn vốn dưới dạng tiền mặt hoặc tài sản doanh nghiệp.', 'Công ty khởi nghiệp đã huy động đủ vốn để tài trợ cho việc phát triển sản phẩm của họ.', 1),
    -- Topic 9 (57-63)
    (57, 'vi', 'Phong cách hoặc phương pháp nấu ăn đặc trưng ẩm thực.', 'Nhà hàng chuyên về ẩm thực Pháp truyền thống.', 1),
    (58, 'vi', 'Đồ uống (trừ nước lọc).', 'Một thức uống miễn phí được phục vụ cùng với mỗi phần ăn trưa đặc biệt.', 1),
    (59, 'vi', 'Món khai vị nhẹ trước bữa ăn chính để kích thích tiêu hóa.', 'Chúng tôi đã gọi một đĩa bánh mì tỏi làm món khai vị.', 1),
    (60, 'vi', 'Sự đặt bàn trước, giữ chỗ ở nhà hàng hoặc khách sạn.', 'Khuyên bạn nên đặt bàn trước vào các tối cuối tuần.', 1),
    (61, 'vi', 'Thực đơn món ăn tại nhà hàng.', 'Người phục vụ đưa cho chúng tôi thực đơn tráng miệng sau khi chúng tôi kết thúc món chính.', 1),
    (62, 'vi', 'Ẩm thực thượng hạng, món ăn cực kỳ ngon, cao cấp.', 'Thành phố nổi tiếng với các chợ ẩm thực thượng hạng.', 1),
    (63, 'vi', 'Dịch vụ phục vụ khách hàng ăn uống.', 'Đồ ăn rất ngon và dịch vụ đặc biệt nhanh chóng.', 1);

-- Tiếng Nhật (ja)
INSERT INTO flashcard_translations (flashcard_id, locale, definition, example_sentence, created_by)
VALUES
    -- Topic 1 (1-7)
    (1, 'ja', '共通の目標を達成するために他の人と協力して働くこと。', '明日までに終わらせるために、この報告書で協力する必要があります。', 1),
    (2, 'ja', 'イベントや行動を後日または後の時間まで延期すること。', 'マネージャーはスタッフ会議を来週の月曜日まで延期することに決めました。', 1),
    (3, 'ja', '何かを完了しなければならない最後の時刻または日付。', '予算案の提出締め切りは金曜日の午後です。', 1),
    (4, 'ja', 'タスクや責任を別の人に委任または割り当てること。', '効果的なリーダーは、チームメンバーにタスクを委任する方法を知っています。', 1),
    (5, 'ja', '正式な会議で議論される議題の一覧。', '議論を始める前に、会議の議題を確認してください。', 1),
    (6, 'ja', '自発的に仕事や公職を退くこと。', '彼女は高等教育を受けるために職を辞する予定です。', 1),
    (7, 'ja', 'タスクや活動の実行を監督し、指導すること。', '彼の主な役割は、工場労働者の日常業務を監督することです。', 1),
    -- Topic 2 (8-14)
    (8, 'ja', '計画されたルートまたは詳細な旅行日程。', 'フライトが確定したら、旅程表のコピーをお送りします。', 1),
    (9, 'ja', '公式業務で支出された費用を本人に払い戻すこと。', '会社は合理的な旅行経費をすべて精算します。', 1),
    (10, 'ja', '人が生活したり滞在したりするための部屋や宿泊施設。', 'コンベンションセンターに近い宿泊施設を見つける必要があります。', 1),
    (11, 'ja', '船、航空機、またはその他の乗り物に入る行為。', 'VN123便 of 搭乗は、約20分後に開始されます。', 1),
    (12, 'ja', '議論や情報交換のための正式な会議。', '来月、多くの業界専門家が年次ビジネス会議に出席します。', 1),
    (13, 'ja', '誰かまたは何かが向かっている目的地。', 'この出張の最終目的地はシンガポールです。', 1),
    (14, 'ja', '何かの事実や正確さを確認または確定すること。', '予約詳細を確認するためにホテルに電話してください。', 1),
    -- Topic 3 (15-21)
    (15, 'ja', '医師によって書かれた、薬の提供を承認する処方指示。', 'この薬は医師の処方箋がある場合のみ購入できます。', 1),
    (16, 'ja', '病気の状態を示しているとみなされる身体的または精神的特徴。', '高熱はインフルエンザの一般的な症状です。', 1),
    (17, 'ja', '検査によって病気の性質を診断・特定すること。', '医師は血液検査の後に病気を診断することができました。', 1),
    (18, 'ja', '病気や怪我に対して患者に提供される医療治療。', '理学療法は腰痛の効果的な治療法です。', 1),
    (19, 'ja', '医療を実践する資格を持つ人、特に内科医師。', '彼女は心臓の状態について専門医に相談することに決めました。', 1),
    (20, 'ja', '特定の日時と場所で誰かと会うための約束や予約。', '明日の午後3時に歯医者の予約があります。', 1),
    (21, 'ja', '外来患者が医療治療を受ける診療所またはクリニック。', '地域の健康クリニックは月曜日から土曜日まで開いています。', 1),
    -- Topic 4 (22-28)
    (22, 'ja', '通常、不満を持つ顧客に対する購入費用の返金。', '購入から30日以内であれば、全額返金を受けることができます。', 1),
    (23, 'ja', '特定のお金が受け取られたことを証明する領収書やレシート。', '購入の証明としてレシートを保管してください。', 1),
    (24, 'ja', '通常の価格からの割引または値引き。', '会員はすべての商品で10％の割引を受ける権利があります。', 1),
    (25, 'ja', '在庫にある製品や商品の完全な在庫一覧。', '本日、店は年次棚卸しのために早く閉まりました。', 1),
    (26, 'ja', '何かを購入する行為。', '彼女は昨日、新しいオフィス機器を大量に購入しました。', 1),
    (27, 'ja', '他者が小売するために大量に安価で商品を販売すること。', '商人はより小さなコンビニエンスストアに製品を卸売りしています。', 1),
    (28, 'ja', '企業から商品やサービスを購入する顧客。', '優れたサービスは、顧客のロイヤルティを維持するための鍵です。', 1),
    -- Topic 5 (29-35)
    (29, 'ja', '現在起こっている行動を表現するために使用される時制。', '習慣や日課を説明するために現在単純形を使用します。', 1),
    (30, 'ja', '将来起こる出来事を表現するために使用される時制。', '未来完了形は、将来のある時点で完了している行動を示します。', 1),
    (31, 'ja', '別の時間に関連して、完了した行動を表す完了時制。', '現在完了形は過去の出来事と現在を結びつけます。', 1),
    (32, 'ja', '一定期間にわたって継続している行動を表す進行時制。', '過去進行形は、過去のある時点で進行中だった動作を説明するために使用されます。', 1),
    (33, 'ja', '時間の経過を直線として表現したタイムライン図。', 'タイムラインを描くことで、学生は行動がいつ発生したかを視覚化できます。', 1),
    (34, 'ja', '時制や態を形成するために使用される助動詞。', '現在完了形では、「have」は助動詞として機能します。', 1),
    (35, 'ja', '文法学習で動詞の異なる変化形（活用）を示すこと。', '学生は英語の不規則動詞の活用方法を学ぶ必要があります。', 1),
    -- Topic 6 (36-42)
    (36, 'ja', '主語が動詞の動作を受ける受動態。', '受動態は公式の報告書でよく使用されます。', 1),
    (37, 'ja', '主語が直接動作を行う能動態。', '通常、能動態で書く方が明確になります。', 1),
    (38, 'ja', '動作を行う、または受ける文の主語。', '受動態の文では、目的語が主語になります。', 1),
    (39, 'ja', '受動態の文で動作を行う人または物（通常「by」が伴う）。', '行為者は、明白であるか重要でない場合は省略できます。', 1),
    (40, 'ja', '動詞から形成され、複合時制を作るために使用される分詞。', '受動態の文は、「be」動詞の形と過去分詞を使って形成されます。', 1),
    (41, 'ja', '文の構成要素間の関係の配列や構造。', '受動態の文の構造を理解することは、テストに不可欠です。', 1),
    (42, 'ja', '書く際に何かに特別な重要性や価値を与えること（強調する）。', '行為者よりも行動を強調するために受動態を使用します。', 1),
    -- Topic 7 (43-49)
    (43, 'ja', '不正アクセスを防ぐためにデータを暗号コードに変換するプロセス。', 'オンラインの金融取引においてデータの暗号化は不可欠です。', 1),
    (44, 'ja', 'コンピュータが使用するプログラムやオペレーティング情報。', 'セキュリティ上の理由から、最新のソフトウェアアップデートをインストールする必要があります。', 1),
    (45, 'ja', 'コンピュータ内に保持されているデータの構造化されたセット。', 'すべての顧客記録は、中央データベースに安全に保管されています。', 1),
    (46, 'ja', '接続された複数のコンピュータシステムで構成されるネットワーク。', 'ITチームはローカルエリアネットワークの復旧に取り組んでいます。', 1),
    (47, 'ja', '新しい方法、アイデア、製品を生み出すプロセスや技術革新。', '技術的なイノベーションが現代の企業の成長を牽引しています。', 1),
    (48, 'ja', 'ユーザーがコンピュータと通信できるようにするインターフェース。', 'このアプリケーションは、操作しやすいユーザーフレンドリーなインターフェースを備えています。', 1),
    (49, 'ja', '一体となって機能するコンピュータ機器やシステムのセット。', '古いコンピュータシステムを最新のクラウドプラットフォームに置き換えています。', 1),
    -- Topic 8 (50-56)
    (50, 'ja', '住宅や財産を購入するための銀行からの不動産担保貸付ローン。', '彼らは最初の家を購入するために30年の住宅ローンを組みました。', 1),
    (51, 'ja', '何かを購入または売却する取引の事例。', 'オンライン取引はわずか数秒で完了しました。', 1),
    (52, 'ja', '借りたお金の使用に対して特定の金利で定期的に支払われる金利利息。', '高金利の貯蓄口座は、より良い投資収益を提供します。', 1),
    (53, 'ja', '個人のまたは組織の財務会計記録に対する公式な会計監査。', '会社の財務記録は毎年、独立した監査を受けます。', 1),
    (54, 'ja', '将来的な金銭的リターンのために資金を投じる投資行為。', '株式市場への投資には、一定レベルのリスクが伴います。', 1),
    (55, 'ja', '負債を支払うことが法的不能であると宣告された破産状態。', '会社は損失から回復できず、破産を宣告しました。', 1),
    (56, 'ja', '企業によって所有されているお金やその他の資産の形態の資本。', 'スタートアップは製品開発の資金を調達するために十分な資本を集めました。', 1),
    -- Topic 9 (57-63)
    (57, 'ja', '特定の国や地域を特徴づける料理のスタイルや調理方法。', 'そのレストランは伝統的なフランス料理を専門としています。', 1),
    (58, 'ja', '水以外の飲料や飲み物。', 'すべてのランチスペシャルに無料の飲料が提供されます。', 1),
    (59, 'ja', '食欲を刺激するために食事の前に出される少量の前菜料理。', '前菜としてガーリックブレッドのプレートを注文しました。', 1),
    (60, 'ja', '事前に行われるテーブルや部屋の予約手配。', '週末の夜は予約することをお勧めします。', 1),
    (61, 'ja', 'レストランで利用可能な料理が掲載されたメニュー表。', 'メインコースが終わった後、サーバーがデザートメニューを渡してくれました。', 1),
    (62, 'ja', '極上の料理、またはそれを理解する高い鑑識眼を持つ美食グルメ。', 'その都市はグルメフードマーケットで有名です。', 1),
    (63, 'ja', 'レストラン等の食事環境における給仕や接客サービス。', '料理は美味しく、サービスは非常に迅速でした。', 1);

-- Tiếng Hàn (ko)
INSERT INTO flashcard_translations (flashcard_id, locale, definition, example_sentence, created_by)
VALUES
    -- Topic 1 (1-7)
    (1, 'ko', '공동의 목표를 달성하기 위해 다른 사람들과 함께 협력하다.', '내일까지 끝내기 위해 이 보고서 작성에 협력해야 합니다.', 1),
    (2, 'ko', '일정이나 행동을 나중으로 미루거나 연기하다.', '부장님은 직원 회의를 다음 주 월요일로 연기하기로 결정했습니다.', 1),
    (3, 'ko', '어떤 일을 마쳐야 하는 가장 늦은 시점이나 날짜인 마감일.', '예산안 제출 마감 기한은 금요일 오후입니다.', 1),
    (4, 'ko', '다른 사람에게 과제나 책임을 위임하거나 맡기다.', '효율적인 리더는 팀원들에게 업무를 위임하는 방법을 압니다.', 1),
    (5, 'ko', '공식 회의에서 논의될 의제나 회의 안건 목록.', '토론을 시작하기 전에 회의 안건을 검토해 주십시오.', 1),
    (6, 'ko', '자발적으로 직장이나 직위에서 사직하다.', '그녀는 고등 교육을 받기 위해 사직할 계획입니다.', 1),
    (7, 'ko', '업무 수행을 지켜보고 지휘하다 (감독하다).', '그의 주요 역할은 공장 근로자들의 일상 활동을 감독하는 것입니다.', 1),
    -- Topic 2 (8-14)
    (8, 'ko', '계획된 경로 또는 구체적인 여행 일정표.', '항공편이 확정되면 여행 일정표 사본을 보내드리겠습니다.', 1),
    (9, 'ko', '업무상 사용된 금액을 본인에게 되돌려주다 (상환하다).', '회사는 모든 합리적인 출장 경비를 상환해 줄 것입니다.', 1),
    (10, 'ko', '머무르거나 거주하기 위한 공간이나 호텔 숙박 시설.', '코엑스 근처의 호텔 숙박 시설을 찾아야 합니다.', 1),
    (11, 'ko', '선박, 항공기 또는 차량 등에 오르는 행위 (탑승).', 'VN123편의 탑승은 약 20분 후에 시작됩니다.', 1),
    (12, 'ko', '정보 교환이나 토론을 위한 공식적인 회의 (학회).', '많은 업계 전문가들이 다음 달 연례 비즈니스 회의에 참석할 것입니다.', 1),
    (13, 'ko', '사람이나 물건이 향해 가고 있는 목적지.', '이번 출장의 최종 목적지는 싱가포르입니다.', 1),
    (14, 'ko', '어떤 사실이나 예약의 정확성을 확인하다.', '예약 세부 사항을 확인하기 위해 호텔에 전화를 걸어 주십시오.', 1),
    -- Topic 3 (15-21)
    (15, 'ko', '의사가 환자에게 의약품을 제공하도록 작성한 처방전.', '이 약은 의사의 처방전이 있어야만 구매할 수 있습니다.', 1),
    (16, 'ko', '질병의 상태를 나타내는 신체적 또는 정신적 징후나 증상.', '고열은 독감의 흔한 증상입니다.', 1),
    (17, 'ko', '검진을 통해 질병의 본질을 진단하다.', '의사는 혈액 검사 후 질병을 진단할 수 있었습니다.', 1),
    (18, 'ko', '질병이나 부상을 치료하기 위해 환자에게 제공되는 치료법.', '물리 치료는 요통에 효과적인 치료법입니다.', 1),
    (19, 'ko', '의사 면허가 있는 의사, 특히 내과계 전문의.', '그녀는 자신의 심장 상태에 대해 전문 의사와 상담하기로 결정했습니다.', 1),
    (20, 'ko', '특정 시간과 장소에서 만나기로 사전에 조율한 예약이나 약속.', '나는 내일 오후 3시에 치과 예약이 있습니다.', 1),
    (21, 'ko', '외래 환자를 치료하는 진료소나 개인 병원.', '지역 보건소는 월요일부터 토요일까지 운영됩니다.', 1),
    -- Topic 4 (22-28)
    (22, 'ko', '불만족스러운 고객에게 구매 비용을 환불해 주는 것.', '구매 후 30일 이내에 전액 환불을 받을 수 있습니다.', 1),
    (23, 'ko', '금액을 수령했음을 증명하여 발행하는 영수증.', '구매 증빙 자료로 영수증을 보관하십시오.', 1),
    (24, 'ko', '물건의 일반 가격에서 깎아주는 할인.', '회원은 모든 품목에 대해 10% 할인을 받을 권리가 있습니다.', 1),
    (25, 'ko', '보관하고 있는 제품이나 물품의 전체 목록인 재고.', '매장은 연례 재고 조사를 위해 오늘 일찍 문을 닫았습니다.', 1),
    (26, 'ko', '어떤 물건을 사는 구매 행위.', '그녀는 어제 새로운 사무실 장비를 대량 구매했습니다.', 1),
    (27, 'ko', '다른 사람이 소매할 수 있도록 대량으로 저렴하게 판매하는 도매.', '상인은 더 작은 편의점에 도매 제품을 판매합니다.', 1),
    (28, 'ko', '상점이나 기업에서 재화나 서비스를 사는 고객.', '우수한 서비스는 고객 충성도를 유지하는 열쇠입니다.', 1),
    -- Topic 5 (29-35)
    (29, 'ko', '현재 일어나는 동작을 표현할 때 사용되는 현재 시제.', '우리는 습관과 일상을 묘사하기 위해 단순 현재 시제를 사용합니다.', 1),
    (30, 'ko', '나중에 일어날 미래의 사건을 표현하는 미래 시제.', '미래 완료 시제는 미래에 완료될 동작을 나타냅니다.', 1),
    (31, 'ko', '다른 시점과 관련하여 완료된 동작을 나타내는 완료 시제.', '현재 완료 시제는 과거의 사건을 현재와 연결합니다.', 1),
    (32, 'ko', '일정 기간 동안 지속되는 동작을 나타내는 진행 시제.', '과거 진행 시제는 과거에 진행 중이었던 동작을 나타낼 때 사용됩니다.', 1),
    (33, 'ko', '시간의 흐름을 나타낸 시간선(타임라인) 그래픽.', '시간선을 그리는 것은 학생들이 동작이 일어나는 시점을 시각화하는 데 도움이 됩니다.', 1),
    (34, 'ko', '시제나 태를 형성할 때 본동사를 도와주는 조동사.', '현재 완료 시제에서 ''have''는 조동사 역할을 합니다.', 1),
    (35, 'ko', '문법 학습을 위해 동사의 형태를 변형(활용)시키다.', '학생들은 영어 불규칙 동사를 변형하는 방법을 배워야 합니다.', 1),
    -- Topic 6 (36-42)
    (36, 'ko', '주어가 동작을 수행하는 것이 아니라 받는 수동태.', '수동태는 공식 보고서에서 자주 사용됩니다.', 1),
    (37, 'ko', '주어가 직접 동작을 수행하는 능동태.', '보통 능동태로 작성하는 것이 더 명확합니다.', 1),
    (38, 'ko', '문장에서 동작을 수행하거나 받는 역할을 하는 주어.', '수동태 문장에서는 목적어가 주어가 됩니다.', 1),
    (39, 'ko', '수동태 문장에서 동작을 수행하여 ''by'' 뒤에 오는 행위자.', '행위자는 명백하거나 중요하지 않은 경우 생략할 수 있습니다.', 1),
    (40, 'ko', '동사에서 형성되어 복합 시제를 만드는데 쓰는 분사(과거 분사 V3).', '수동태 문장은 ''be'' 동사 형태와 과거 분사를 사용하여 만들어집니다.', 1),
    (41, 'ko', '문장의 각 성분 간의 관계 배열이나 구조.', '수동태 문장의 구조를 이해하는 것은 시험에 필수적입니다.', 1),
    (42, 'ko', '말하기나 쓰기에서 특정 사실의 중요성을 강조하다.', '행위자보다 행위를 강조하기 위해 수동태를 사용합니다.', 1),
    -- Topic 7 (43-49)
    (43, 'ko', '데이터의 비인가 접근을 막기 위해 암호 코드로 변환하는 암호화.', '데이터 암호화는 온라인 금융 거래에 매우 중요합니다.', 1),
    (44, 'ko', '컴퓨터에 쓰이는 작동 프로그램이나 기타 정보인 소프트웨어.', '보안상의 이유로 최신 소프트웨어 업데이트를 설치해야 합니다.', 1),
    (45, 'ko', '컴퓨터에 저장 및 구성된 데이터의 체계적인 집합인 데이터베이스.', '모든 고객 기록은 당사의 중앙 데이터베이스에 안전하게 저장됩니다.', 1),
    (46, 'ko', '두 개 이상의 컴퓨터 시스템이 연결된 상태나 네트워크.', 'IT 팀은 로컬 영역 네트워크 복구를 위해 작업 중입니다.', 1),
    (47, 'ko', '새로운 방법이나 아이디어를 도입하는 기술 혁신.', '기술 혁신은 현대 기업의 성장을 주도합니다.', 1),
    (48, 'ko', '사용자가 컴퓨터와 쉽게 소통할 수 있게 돕는 프로그램인 인터페이스.', '이 애플리케이션은 탐색하기 쉬운 사용자 친화적인 인터페이스를 가지고 있습니다.', 1),
    (49, 'ko', '함께 작동하여 기능을 수행하는 장비의 집합체인 시스템.', '우리는 오래된 컴퓨터 시스템을 현대적인 클라우드 플랫폼으로 교체하고 있습니다.', 1),
    -- Topic 8 (50-56)
    (50, 'ko', '집이나 부동산을 사기 위해 은행에서 자금을 빌리는 주택 담보 대출.', '그들은 첫 집을 사기 위해 30년 만기 주택 담보 대출을 받았습니다.', 1),
    (51, 'ko', '사고파는 개별적인 행위나 비즈니스 거래.', '온라인 거래는 불과 몇 초 만에 완료되었습니다.', 1),
    (52, 'ko', '돈을 빌려 쓴 대가로 정기적으로 지급하는 금리나 이자.', '고금리 예금 계좌는 더 나은 투자 수익을 제공합니다.', 1),
    (53, 'ko', '회사의 재무나 계정 등을 공식적으로 검사하는 회계 감사.', '회사의 재무 기록은 매년 독립적인 회계 감사를 받습니다.', 1),
    (54, 'ko', '재정적 수익을 바라고 자금을 투입하는 투자.', '주식 시장에 투자하는 것은 어느 정도의 위험을 수반합니다.', 1),
    (55, 'ko', '채무를 갚을 수 없어 법적으로 선고받는 파산 상태.', '회사는 손실에서 회복하지 못하고 파산을 선언했습니다.', 1),
    (56, 'ko', '비즈니스를 위해 기업이 보유하는 자본이나 자금.', '스타트업은 제품 개발 자금을 조달하기 위해 충분한 자본을 유치했습니다.', 1),
    -- Topic 9 (57-63)
    (57, 'ko', '특정 국가나 지방 특유의 요리 방식이나 음식 스타일.', '그 레스토랑은 전통 프랑스 요리를 전문으로 합니다.', 1),
    (58, 'ko', '물 이외의 다양한 마실 거리인 음료.', '모든 특별 점심 메뉴에는 무료 음료가 제공됩니다.', 1),
    (59, 'ko', '입맛을 돋우기 위해 식사 전에 제공되는 가벼운 전채 요리.', '우리는 전채 요리로 마늘빵 한 접시를 주문했습니다.', 1),
    (60, 'ko', '식당이나 호텔 등의 자리를 미리 약속하는 예약.', '주말 밤에는 예약하는 것이 좋습니다.', 1),
    (61, 'ko', '음식점 등에서 제공하는 요리가 적힌 메뉴판.', '메인 요리가 끝난 후 웨이터가 디저트 메뉴판을 건네주었습니다.', 1),
    (62, 'ko', '고급 미식 또는 고급 음식을 즐기는 미식가.', '그 도시는 고급 미식가 푸드 마켓으로 유명합니다.', 1),
    (63, 'ko', '식당 등에서 손님을 돕고 접대하는 서비스.', '음식은 맛있었고 서비스는 예외적으로 빨랐습니다.', 1);

-- Thiết lập lại sequence cho translations sau khi chèn bằng ID thủ công
SELECT setval('flashcard_translations_id_seq', (SELECT MAX(id) FROM flashcard_translations));
SELECT setval('topic_translations_id_seq', (SELECT MAX(id) FROM topic_translations));

-- 7. Chèn Quiz Options cho 63 Flashcards (4 options cho mỗi thẻ)
-- Option đúng và các Distractors được diễn giải bằng tiếng Anh
INSERT INTO quiz_options (flashcard_id, option_text, is_correct)
VALUES
    -- Card 1: Collaborate
    (1, 'To work together with others to achieve a common goal.', TRUE),
    (1, 'To work completely alone on a report.', FALSE),
    (1, 'To refuse any help from team members.', FALSE),
    (1, 'To argue about budget allocation.', FALSE),
    -- Card 2: Postpone
    (2, 'To delay an event or action until a later time.', TRUE),
    (2, 'To cancel a meeting permanently.', FALSE),
    (2, 'To start a project earlier than planned.', FALSE),
    (2, 'To speed up the execution of a task.', FALSE),
    -- Card 3: Deadline
    (3, 'The latest time or date by which something must be completed.', TRUE),
    (3, 'The duration of a business meeting.', FALSE),
    (3, 'The starting point of a new project.', FALSE),
    (3, 'The break time between work sessions.', FALSE),
    -- Card 4: Delegate
    (4, 'To entrust a task or responsibility to another person.', TRUE),
    (4, 'To complete a task entirely on one''s own.', FALSE),
    (4, 'To fire a staff member for poor performance.', FALSE),
    (4, 'To reject a proposal submitted by a teammate.', FALSE),
    -- Card 5: Agenda
    (5, 'A list of items to be discussed at a formal meeting.', TRUE),
    (5, 'A book containing travel expenses.', FALSE),
    (5, 'A feedback form filled by participants.', FALSE),
    (5, 'A map showing the location of the office.', FALSE),
    -- Card 6: Resign
    (6, 'To voluntarily leave a job or official position.', TRUE),
    (6, 'To apply for a higher-paying position.', FALSE),
    (6, 'To request a long vacation from the company.', FALSE),
    (6, 'To hire a new executive assistant.', FALSE),
    -- Card 7: Supervise
    (7, 'To observe and direct the execution of a task or activity.', TRUE),
    (7, 'To perform physical work in a factory.', FALSE),
    (7, 'To ignore the safety guidelines at work.', FALSE),
    (7, 'To design the blueprint of a facility.', FALSE),

    -- Card 8: Itinerary
    (8, 'A planned route or detailed journey.', TRUE),
    (8, 'A passport validation document.', FALSE),
    (8, 'A receipt of flight ticket purchase.', FALSE),
    (8, 'A description of hotel facilities.', FALSE),
    -- Card 9: Reimburse
    (9, 'To repay a person who has spent money for official business.', TRUE),
    (9, 'To fine an employee for arriving late.', FALSE),
    (9, 'To borrow money from a colleague.', FALSE),
    (9, 'To deposit salary into a bank account.', FALSE),
    -- Card 10: Accommodation
    (10, 'A room or group of rooms in which someone may live or stay.', TRUE),
    (10, 'A vehicle used for commercial transport.', FALSE),
    (10, 'A travel bag used for packing clothes.', FALSE),
    (10, 'An office space used for conferences.', FALSE),
    -- Card 11: Boarding
    (11, 'The act of entering a ship, aircraft, or other vehicle.', TRUE),
    (11, 'The process of printing a travel visa.', FALSE),
    (11, 'The safety training session before a flight.', FALSE),
    (11, 'The luggage weight inspection.', FALSE),
    -- Card 12: Conference
    (12, 'A formal meeting for discussion or exchange of information.', TRUE),
    (12, 'A small dinner party with close friends.', FALSE),
    (12, 'An individual sports competition.', FALSE),
    (12, 'A musical performance at a theater.', FALSE),
    -- Card 13: Destination
    (13, 'The place to which someone or something is going.', TRUE),
    (13, 'The starting point of a travel route.', FALSE),
    (13, 'The cost of transport tickets.', FALSE),
    (13, 'The speed of an express train.', FALSE),
    -- Card 14: Confirm
    (14, 'To establish the truth or correctness of something.', TRUE),
    (14, 'To cancel a booking due to change of plans.', FALSE),
    (14, 'To query about availability of rooms.', FALSE),
    (14, 'To delay checking in to a hotel.', FALSE),

    -- Card 15: Prescription
    (15, 'An instruction written by a medical practitioner authorizing a medicine.', TRUE),
    (15, 'A billing statement from a clinic.', FALSE),
    (15, 'A schedule of medical appointments.', FALSE),
    (15, 'A certificate of physical fitness.', FALSE),
    -- Card 16: Symptom
    (16, 'A physical or mental feature indicating a condition of disease.', TRUE),
    (16, 'A complete cure of a medical illness.', FALSE),
    (16, 'A medical test conducted in a laboratory.', FALSE),
    (16, 'A vaccine shot for immunization.', FALSE),
    -- Card 17: Diagnose
    (17, 'To identify the nature of an illness by examination.', TRUE),
    (17, 'To treat an injury with physical therapy.', FALSE),
    (17, 'To perform surgery on a patient.', FALSE),
    (17, 'To prescribe pain relief medicine.', FALSE),
    -- Card 18: Treatment
    (18, 'Medical care given to a patient for an illness or injury.', TRUE),
    (18, 'The diagnosis of a psychological condition.', FALSE),
    (18, 'The medical insurance plan of an organization.', FALSE),
    (18, 'The cost of staying in a hospital ward.', FALSE),
    -- Card 19: Physician
    (19, 'A person qualified to practice medicine, especially a doctor.', TRUE),
    (19, 'A pharmacist who prepares medicines.', FALSE),
    (19, 'A patient receiving medical treatment.', FALSE),
    (19, 'A nurse assisting in the emergency room.', FALSE),
    -- Card 20: Appointment
    (20, 'An arrangement to meet someone at a particular time and place.', TRUE),
    (20, 'A random drop-in visit to a medical store.', FALSE),
    (20, 'An official warning about health hazards.', FALSE),
    (20, 'A medical report issued by a lab.', FALSE),
    -- Card 21: Clinic
    (21, 'An establishment where outpatients are given medical treatment.', TRUE),
    (21, 'A pharmaceutical factory making vaccines.', FALSE),
    (21, 'A fitness club offering workout sessions.', FALSE),
    (21, 'A large public library for medical books.', FALSE),

    -- Card 22: Refund
    (22, 'A repayment of a sum of money to a customer.', TRUE),
    (22, 'An extra fee charged for fast delivery.', FALSE),
    (22, 'A gift card given to high-spending buyers.', FALSE),
    (22, 'A tax applied on luxury merchandise.', FALSE),
    -- Card 23: Receipt
    (23, 'A written statement confirming that money has been received.', TRUE),
    (23, 'A catalog showcasing newly arrived items.', FALSE),
    (23, 'A shopping bag made of recycled paper.', FALSE),
    (23, 'A discount coupon valid for next purchase.', FALSE),
    -- Card 24: Discount
    (24, 'A deduction from the usual cost of something.', TRUE),
    (24, 'An increase in price due to high demand.', FALSE),
    (24, 'A penalty for returning items late.', FALSE),
    (24, 'A shipping fee calculated by distance.', FALSE),
    -- Card 25: Inventory
    (25, 'A complete list of items or goods in stock.', TRUE),
    (25, 'A shopping invoice sent to a buyer.', FALSE),
    (25, 'A design blueprint of a retail outlet.', FALSE),
    (25, 'A list of employees working in the store.', FALSE),
    -- Card 26: Purchase
    (26, 'The act of buying something.', TRUE),
    (26, 'The act of selling goods at a premium.', FALSE),
    (26, 'The return of damaged goods for repair.', FALSE),
    (26, 'The transport of cargo to a warehouse.', FALSE),
    -- Card 27: Wholesale
    (27, 'The selling of goods in large quantities at lower prices.', TRUE),
    (27, 'The transaction between a retail store and an end customer.', FALSE),
    (27, 'The export of merchandise to another nation.', FALSE),
    (27, 'The auction of vintage collector items.', FALSE),
    -- Card 28: Customer
    (28, 'A person who buys goods or services from a business.', TRUE),
    (28, 'A supplier providing raw materials to a factory.', FALSE),
    (28, 'A security officer guarding a store entrance.', FALSE),
    (28, 'A supervisor managing warehouse employees.', FALSE),

    -- Card 29: Present
    (29, 'The tense used to describe actions happening right now.', TRUE),
    (29, 'The tense describing actions completed in the past.', FALSE),
    (29, 'The tense describing future possibilities.', FALSE),
    (29, 'The grammatical structure of passive sentences.', FALSE),
    -- Card 30: Future
    (30, 'The tense used to express events that will happen later.', TRUE),
    (30, 'The tense expressing a habitual action in past life.', FALSE),
    (30, 'The structure representing continuous action in past.', FALSE),
    (30, 'The root form of an irregular verb.', FALSE),
    -- Card 31: Perfect
    (31, 'The tense representing completed actions in relation to another time.', TRUE),
    (31, 'A tense expressing continuous, ongoing progress right now.', FALSE),
    (31, 'A verb structure that has no auxiliary assistance.', FALSE),
    (31, 'The simple form of past verb conjugation.', FALSE),
    -- Card 32: Continuous
    (32, 'The tense representing ongoing actions over a period of time.', TRUE),
    (32, 'A completed tense showing no active progression.', FALSE),
    (32, 'A passive structure omitting the active agent.', FALSE),
    (32, 'The base infinitive form of an active verb.', FALSE),
    -- Card 33: Timeline
    (33, 'A graphic representation of a passage of time as a line.', TRUE),
    (33, 'A dictionary defining complex grammatical terms.', FALSE),
    (33, 'A quiz testing english tenses proficiency.', FALSE),
    (33, 'A table showing regular verb conjugations.', FALSE),
    -- Card 34: Auxiliary
    (34, 'A helping verb used in forming tenses or moods.', TRUE),
    (34, 'A main verb representing the main physical action.', FALSE),
    (34, 'A noun representing the subject of a sentence.', FALSE),
    (34, 'A punctuation mark separating clause structures.', FALSE),
    -- Card 35: Conjugate
    (35, 'To give the different forms of a verb in grammar study.', TRUE),
    (35, 'To identify subject-verb agreement mistakes.', FALSE),
    (35, 'To construct passive sentence structures.', FALSE),
    (35, 'To pronounce irregular words correctly.', FALSE),

    -- Card 36: Passive
    (36, 'The voice where the subject receives the action of the verb.', TRUE),
    (36, 'The voice where the subject performs the physical action.', FALSE),
    (36, 'A sentence omitting the active helping verb.', FALSE),
    (36, 'A tense indicating continuous future events.', FALSE),
    -- Card 37: Active
    (37, 'The voice where the subject performs the action.', TRUE),
    (37, 'The voice where the subject receives the verb''s impact.', FALSE),
    (37, 'A clause structure indicating passive action.', FALSE),
    (37, 'A sentence lacking a main direct object.', FALSE),
    -- Card 38: Subject
    (38, 'The person or thing that performs or receives the action.', TRUE),
    (38, 'The direct object indicating what is acted upon.', FALSE),
    (38, 'A helping verb showing grammatical tense.', FALSE),
    (38, 'A conjunction joining two distinct clauses.', FALSE),
    -- Card 39: Agent
    (39, 'The person or thing performing the action in a passive sentence.', TRUE),
    (39, 'The passive helping verb structure.', FALSE),
    (39, 'The receiver of the verb''s physical impact.', FALSE),
    (39, 'A preposition indicating destination and route.', FALSE),
    -- Card 40: Participle
    (40, 'A word formed from a verb and used to form compound tenses.', TRUE),
    (40, 'A pronoun replacing the main subject.', FALSE),
    (40, 'An adverb modifying active verbs.', FALSE),
    (40, 'A preposition showing physical location.', FALSE),
    -- Card 41: Structure
    (41, 'The arrangement of relations between parts of a sentence.', TRUE),
    (41, 'The literal definition of active vocabulary.', FALSE),
    (41, 'The historical evolution of syntax rules.', FALSE),
    (41, 'A test assessing syntax proficiency.', FALSE),
    -- Card 42: Emphasize
    (42, 'To give special importance or value to something in writing.', TRUE),
    (42, 'To skip irrelevant paragraphs in writing.', FALSE),
    (42, 'To correct spelling errors in a report.', FALSE),
    (42, 'To translate a sentence into another language.', FALSE),

    -- Card 43: Encryption
    (43, 'The process of converting data into a code to prevent unauthorized access.', TRUE),
    (43, 'The physical cooling system of IT servers.', FALSE),
    (43, 'The export of database tables into CSV format.', FALSE),
    (43, 'The hardware assembly of central processing units.', FALSE),
    -- Card 44: Software
    (44, 'The programs and other operating information used by a computer.', TRUE),
    (44, 'The physical motherboard inside a computer chassis.', FALSE),
    (44, 'The copper cables linking local routers.', FALSE),
    (44, 'The external screen showing graphic interfaces.', FALSE),
    -- Card 45: Database
    (45, 'A structured set of data held in a computer.', TRUE),
    (45, 'A network cable linking offices.', FALSE),
    (45, 'A software tool designed for graphic editing.', FALSE),
    (45, 'An internet browser accessing public web portals.', FALSE),
    -- Card 46: Network
    (46, 'A group of two or more computer systems linked together.', TRUE),
    (46, 'A physical monitor displaying high-resolution images.', FALSE),
    (46, 'An antivirus program guarding files.', FALSE),
    (46, 'A structured spreadsheet holding corporate data.', FALSE),
    -- Card 47: Innovation
    (47, 'The action or process of innovating a new method or product.', TRUE),
    (47, 'The copy of existing software designs.', FALSE),
    (47, 'The routine maintenance of IT server racks.', FALSE),
    (47, 'The disposal of obsolete hardware items.', FALSE),
    -- Card 48: Interface
    (48, 'A device or program enabling a user to communicate with a computer.', TRUE),
    (48, 'A database constraint preventing duplicate entries.', FALSE),
    (48, 'A cyber security wall blocking traffic.', FALSE),
    (48, 'A network protocol transferring large records.', FALSE),
    -- Card 49: System
    (49, 'A set of computer equipment working together.', TRUE),
    (49, 'A single electrical plug providing energy.', FALSE),
    (49, 'An external device holding backed-up files.', FALSE),
    (49, 'A programming language used for script coding.', FALSE),

    -- Card 50: Mortgage
    (50, 'A loan to purchase a home or property.', TRUE),
    (50, 'A cash deposit made in a check account.', FALSE),
    (50, 'An annual bonus given to bank executives.', FALSE),
    (50, 'A currency exchange commission rate.', FALSE),
    -- Card 51: Transaction
    (51, 'An instance of buying or selling something.', TRUE),
    (51, 'The auditing of internal corporate books.', FALSE),
    (51, 'The design of new bank credit products.', FALSE),
    (51, 'A policy locking accounts for verification.', FALSE),
    -- Card 52: Interest
    (52, 'Money paid regularly at a particular rate for the use of money lent.', TRUE),
    (52, 'The principal amount borrowed from a bank.', FALSE),
    (52, 'A transaction fee charged at local cash machines.', FALSE),
    (52, 'The tax applied on corporate annual earnings.', FALSE),
    -- Card 53: Audit
    (53, 'An official inspection of financial accounts.', TRUE),
    (53, 'A financial forecast for upcoming fiscal years.', FALSE),
    (53, 'A deposit of physical gold in high-security vaults.', FALSE),
    (53, 'An investment transaction made on stock indices.', FALSE),
    -- Card 54: Investment
    (54, 'The action of investing money for financial return.', TRUE),
    (54, 'The state of having severe debt liabilities.', FALSE),
    (54, 'The process of declaring complete financial failure.', FALSE),
    (54, 'An official audit conducted by state agencies.', FALSE),
    -- Card 55: Bankruptcy
    (55, 'The state of being legally declared unable to pay debts.', TRUE),
    (55, 'A massive financial profit earned by a company.', FALSE),
    (55, 'An investment made in foreign currency assets.', FALSE),
    (55, 'A loan contract signed between two corporate banks.', FALSE),
    -- Card 56: Capital
    (56, 'Wealth in the form of money or assets owned by an organization.', TRUE),
    (56, 'The annual tax invoice issued by state authorities.', FALSE),
    (56, 'The loss incurred during a business quarter.', FALSE),
    (56, 'The fee paid to financial legal advisers.', FALSE),

    -- Card 57: Cuisine
    (57, 'A style or method of cooking characteristic of a country.', TRUE),
    (57, 'A dining reservation made for a large family.', FALSE),
    (57, 'A book containing restaurant reviews.', FALSE),
    (57, 'A layout map showing kitchen workstation setups.', FALSE),
    -- Card 58: Beverage
    (58, 'A drink, especially one other than water.', TRUE),
    (58, 'A meal cooked inside restaurant kitchens.', FALSE),
    (58, 'A custom plate design for appetizers.', FALSE),
    (58, 'A tool used for uncorking expensive wines.', FALSE),
    -- Card 59: Appetizer
    (59, 'A small dish taken before a meal to stimulate appetite.', TRUE),
    (59, 'A heavy sweet dessert eaten after dining.', FALSE),
    (59, 'A main steak meal served with potato chips.', FALSE),
    (59, 'A hot coffee beverage ending a course.', FALSE),
    -- Card 60: Reservation
    (60, 'An arrangement to secure a table or room in advance.', TRUE),
    (60, 'The feedback report written after dinner.', FALSE),
    (60, 'The payment of dinner costs via bank cards.', FALSE),
    (60, 'A tip paid to hard-working servers.', FALSE),
    -- Card 61: Menu
    (61, 'A list of dishes available in a restaurant.', TRUE),
    (61, 'A receipt itemizing food items purchased.', FALSE),
    (61, 'A feedback tablet located at entry doors.', FALSE),
    (61, 'A training document given to restaurant servers.', FALSE),
    -- Card 62: Gourmet
    (62, 'High-quality or exotic food, or a person who appreciates it.', TRUE),
    (62, 'A fast food burger sold at low prices.', FALSE),
    (62, 'A person who hates dining in public restaurants.', FALSE),
    (62, 'An automatic washing machine for restaurant plates.', FALSE),
    -- Card 63: Service
    (63, 'The action of helping or doing work for someone in a dining setting.', TRUE),
    (63, 'The process of cooking complex cuisines.', FALSE),
    (63, 'The purchase of fresh vegetables from markets.', FALSE),
    (63, 'The decoration of dining halls for weddings.', FALSE);

-- Thiết lập lại sequence cho quiz_options sau khi chèn bằng ID thủ công
SELECT setval('quiz_options_id_seq', (SELECT MAX(id) FROM quiz_options));

-- 8. Chèn một số bản ghi mẫu cho user_progress và quiz_attempts bằng ID mới
-- Giúp các tài khoản mẫu hoạt động bình thường, không bị lỗi liên kết
INSERT INTO user_progress (user_id, flashcard_id, status, review_count, correct_count, easiness_factor, interval_days, next_review_at)
VALUES
    (3, 1, 'LEARNING', 1, 1, 2.50, 1, NOW() + INTERVAL '1 day'),
    (3, 2, 'MASTERED', 5, 5, 2.60, 30, NOW() + INTERVAL '30 days'),
    (4, 1, 'NEW', 0, 0, 2.50, 1, NOW()),
    (3, 3, 'LEARNING', 1, 0, 1.70, 1, NOW() + INTERVAL '1 day'),
    (3, 8, 'NEW', 0, 0, 2.50, 1, NOW()),
    (3, 15, 'LEARNING', 1, 1, 2.50, 1, NOW() + INTERVAL '1 day');

INSERT INTO quiz_attempts (id, user_id, topic_id, quiz_type, total_questions, correct_answers, score, duration_seconds, started_at, finished_at)
VALUES
    (1, 3, 1, 'MULTIPLE_CHOICE', 7, 6, 85, 90, NOW() - INTERVAL '1 hour', NOW()),
    (2, 3, 2, 'TRUE_FALSE', 5, 5, 100, 45, NOW() - INTERVAL '30 minutes', NOW());

INSERT INTO quiz_answers (attempt_id, flashcard_id, selected_answer, correct_answer, is_correct, time_spent_seconds)
VALUES
    (1, 1, 'To work together with others to achieve a common goal.', 'To work together with others to achieve a common goal.', TRUE, 12),
    (1, 2, 'To delay an event or action until a later time.', 'To delay an event or action until a later time.', TRUE, 10),
    (1, 3, 'To avoid completing tasks.', 'The latest time or date by which something must be completed.', FALSE, 15);

SELECT setval('quiz_attempts_id_seq', (SELECT MAX(id) FROM quiz_attempts));
SELECT setval('quiz_answers_id_seq', (SELECT MAX(id) FROM quiz_answers));
SELECT setval('user_progress_id_seq', (SELECT MAX(id) FROM user_progress));

COMMIT;
