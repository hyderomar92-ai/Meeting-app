
export interface Student {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  studentClass?: string;
  nationality?: string;
  gender?: string;
  qId?: string;
  dob?: string;
  
  // Parent/Guardian Details
  fatherName?: string;
  fatherPhone?: string;
  fatherEmail?: string;
  motherName?: string;
  motherPhone?: string;
  motherEmail?: string;
}

// Populated with data extracted from provided documents
export const STUDENTS: Student[] = [
  { 
    id: 'QAAMAB0001B04530', 
    name: 'Abdulaziz Jaber A A', 
    gender: 'Male', 
    nationality: 'Qatari', 
    dob: '2019-11-13',
    qId: '31963406100',
    email: 'B04530@amab.com.qa',
    studentClass: '01A',
    fatherPhone: '55666677',
    fatherEmail: '28163400406@taallumparents.com'
  },
  { 
    id: 'QAAMAB0001B04543', 
    name: 'Abdulhadi Ali S A', 
    gender: 'Male', 
    nationality: 'Qatari', 
    dob: '2020-03-14',
    qId: '32063402098',
    email: 'B04543@amab.com.qa',
    studentClass: '01A',
    fatherPhone: '55550402',
    fatherEmail: '28963403533@taallumparents.com'
  },
  { 
    id: 'QAAMAB0001B04934', 
    name: 'Abdulla Hamad M A', 
    gender: 'Male', 
    nationality: 'Qatari', 
    dob: '2019-10-01',
    qId: '31963405528',
    email: 'B04934@amab.com.qa',
    studentClass: '01A',
    fatherPhone: '55444207',
    fatherEmail: '29363403737@taallumparents.com'
  },
  { 
    id: 'QAAMAB0001B04477', 
    name: 'Abdulla Ibrahim A M', 
    gender: 'Male', 
    nationality: 'Qatari', 
    dob: '2020-04-24',
    qId: '32063401996',
    email: 'B04477@amab.com.qa',
    studentClass: '01A',
    fatherPhone: '30200060',
    fatherEmail: '29063401273@taallumparents.com'
  },
  { 
    id: 'QAAMAB0001B04531', 
    name: 'Abdulla Abdulrahman B A', 
    gender: 'Male', 
    nationality: 'Qatari', 
    dob: '2019-07-07',
    qId: '31963407646',
    email: 'B04531@amab.com.qa',
    studentClass: '01B',
    fatherPhone: '30103010',
    fatherEmail: '29063401813@taallumparents.com',
    fatherName: 'Abdulaziz Sulaiman A M Al-Hamadi'
  },
  { 
    id: 'QAAMAB0001B04576', 
    name: 'Abdulrahman Salem A M', 
    gender: 'Male', 
    nationality: 'Qatari', 
    dob: '2020-08-03',
    qId: '32063403479',
    email: 'B04576@amab.com.qa',
    studentClass: '01B',
    fatherPhone: '55900331',
    fatherEmail: '29063400116@taallumparents.com'
  },
  { 
    id: 'QAAMAB0001B04571', 
    name: 'Ahmad Khalid A M', 
    gender: 'Male', 
    nationality: 'Qatari', 
    dob: '2019-10-12',
    qId: '31963405369',
    email: 'B04571@amab.com.qa',
    studentClass: '01C',
    fatherPhone: '77779872',
    fatherEmail: '29263404489@taallumparents.com',
    fatherName: 'Ali Saleh H M Jarhab'
  },
  { 
    id: 'QAAMAB0001B04519', 
    name: 'Ahmed Saleh A A', 
    gender: 'Male', 
    nationality: 'Qatari', 
    dob: '2020-01-27',
    qId: '32063400395',
    email: 'B04519@amab.com.qa',
    studentClass: '01C',
    fatherPhone: '66668486',
    fatherEmail: '28963400774@taallumparents.com'
  },
  { 
    id: 'QAAMAB0001B04831', 
    name: 'Hamad Ejaiyan H D', 
    gender: 'Male', 
    nationality: 'Qatari', 
    dob: '2019-12-18',
    qId: '31963406948',
    email: 'B04831@amab.com.qa',
    studentClass: '01D',
    fatherPhone: '33453333',
    fatherEmail: '29463400856@taallumparents.com'
  },
  { 
    id: 'QAAMAB0001B04578', 
    name: 'Hamad Salem A D', 
    gender: 'Male', 
    nationality: 'Qatari',
    dob: '2019-07-15',
    qId: '31963403676',
    email: 'B04578@amab.com.qa',
    studentClass: '01D',
    fatherPhone: '55097663',
    fatherEmail: '29463400730@taallumparents.com',
    fatherName: 'Salem Masoud S M Al-Hababi'
  },
  { 
    id: 'QAAMAB0001B04840', 
    name: 'Hamad Saeed H S', 
    gender: 'Male', 
    nationality: 'Qatari',
    dob: '2020-02-05',
    qId: '32063400502',
    email: 'B04840@amab.com.qa',
    studentClass: '01E',
    fatherPhone: '30000485',
    fatherEmail: '29163404657@taallumparents.com'
  },
  { 
    id: 'QAAMAB0001B04599', 
    name: 'Jassim Abdulla A A', 
    gender: 'Male', 
    nationality: 'Qatari',
    dob: '2019-03-04',
    qId: '31963400911',
    email: 'B04599@amab.com.qa',
    studentClass: '01F',
    fatherPhone: '66889991',
    fatherEmail: '28663403669@taallumparents.com',
    fatherName: 'Ahmed Farhan F Z Al-Hababi'
  },
  { 
    id: 'QAAMAB0001B05087', 
    name: 'Khalid Saeed K S', 
    gender: 'Male', 
    nationality: 'Qatari',
    dob: '2019-12-24',
    qId: '31963407154',
    email: 'B05087@amab.com.qa',
    studentClass: '01F',
    fatherPhone: '70009992',
    fatherEmail: '27963403136@taallumparents.com',
    fatherName: 'Mohammed Salem M S Al-Fehaidi'
  },
  { 
    id: 'QAAMAB0001B04539', 
    name: 'Mohammed Abdulla B A', 
    gender: 'Male', 
    nationality: 'Qatari', 
    dob: '2019-11-08',
    qId: '31963407230',
    email: 'B04539@amab.com.qa',
    studentClass: '01G',
    fatherPhone: '66669502',
    fatherEmail: '29463400692@amab.com.qa'
  },
  { 
    id: 'QAAMAB0001B04579', 
    name: 'Mohammed Mubarak S R', 
    gender: 'Male', 
    nationality: 'Qatari',
    dob: '2019-03-27',
    qId: '31963401559',
    email: 'B04579@amab.com.qa',
    studentClass: '02A',
    fatherPhone: '55075335',
    fatherEmail: '28763400659@taallumparents.com',
    fatherName: 'Abdulrahman Mohammed Y Jolo'
  },
  { 
    id: 'QAAMAB0001B04631', 
    name: 'Mohammed Ebrahim M R', 
    gender: 'Male', 
    nationality: 'Qatari', 
    dob: '2020-08-08',
    qId: '32063403797',
    email: 'B04631@amab.com.qa',
    studentClass: '02B',
    fatherPhone: '55433533',
    fatherEmail: '28463403542@taallumparents.com',
    fatherName: 'Jassim Mohamed Joloh'
  },
  { 
    id: 'QAAMAB0001B04464', 
    name: 'Nasser Rashid M N', 
    gender: 'Male', 
    nationality: 'Qatari',
    dob: '2019-04-19',
    qId: '31963402802',
    email: 'B04464@amab.com.qa',
    studentClass: '02B',
    fatherPhone: '66696994',
    fatherEmail: '27863400698@taallumparents.com',
    fatherName: 'Hadi Mohamed A B Al-Maari'
  },
  { 
    id: 'QAAMAB0001006249', 
    name: 'Abdulrahman Khalid A.A.', 
    gender: 'Male', 
    nationality: 'Qatari', 
    dob: '2013-07-29',
    qId: '31363404917',
    email: 'B03372@amab.com.qa',
    studentClass: '05D',
    fatherPhone: '55034342',
    fatherEmail: '28063402364@taallumparents.com',
    motherName: 'Fadhal Jamal K A Al-Naimi'
  },
  { 
    id: 'QAAMAB0001B03448', 
    name: 'Jassim Ali M M', 
    gender: 'Male', 
    nationality: 'Qatari', 
    dob: '2012-02-28',
    qId: '31263400997',
    email: 'B03448@amab.com.qa',
    studentClass: '06C',
    fatherPhone: '55823491',
    fatherEmail: '27263402514@Taallumparents.com'
  },
  {
    id: 'QAAMAB0001B04629',
    name: 'Adyan Adel',
    gender: 'Male',
    nationality: 'Egyptian',
    dob: '2015-04-16',
    qId: '31581801054',
    email: 'B04629@amab.com.qa',
    studentClass: '03C',
    fatherPhone: '66004949',
    fatherEmail: '27163400297@taallumparents.com',
    motherName: 'Aisha Adel Elbana'
  },
  {
    id: 'QAAMAB0001B04437',
    name: 'Bayjid Ahmed',
    gender: 'Male',
    nationality: 'British',
    dob: '2018-04-23',
    qId: '31882600584',
    email: 'B04437@amab.com.qa',
    studentClass: '01C',
    fatherPhone: '55133311',
    fatherEmail: '28963403279@taallumparents.com'
  },
  {
    id: 'QAAMAB0001006238',
    name: 'Abdulla Mohamed A J',
    gender: 'Male',
    nationality: 'Qatari',
    dob: '2012-01-01',
    qId: '31263400063',
    email: 'B04200@amab.com.qa',
    studentClass: '05A',
    fatherPhone: '55559222',
    fatherEmail: 'y_almutawa@lusail.com'
  },
   {
    id: 'QAAMAB0001B03701',
    name: 'Ali A.Wahab M H',
    gender: 'Male',
    nationality: 'Qatari',
    dob: '2013-01-19',
    qId: '31363400261',
    email: 'B03701@amab.com.qa',
    studentClass: '04D',
    fatherPhone: '30103010',
    fatherEmail: '29063401813@taallumparents.com'
  },
  {
     id: 'QAAMAB0001B04460',
     name: 'Tamim Abdo Hussein',
     gender: 'Male',
     nationality: 'Qatari',
     dob: '2012-12-09',
     qId: '31263406435',
     email: 'B04460@amab.com.qa',
     studentClass: '06C',
     fatherPhone: '55034342',
     fatherEmail: '28063402364@taallumparents.com',
     motherName: 'Abdo Almadwry'
  },
  {
      id: 'QAAMAB0001B04623',
      name: 'Kiyan Ali',
      gender: 'Male',
      nationality: 'Qatari',
      dob: '2018-07-26',
      qId: '31863404255',
      email: 'B04623@amab.com.qa',
      studentClass: '01B',
      fatherPhone: '55040204',
      fatherEmail: '28463400909@Taallumparents.com',
      fatherName: 'Ali Saad Th M Al-Qahtani'
  },
  {
    id: 'QAAMAB0001B04743',
    name: 'Hamad Abdulla S A',
    gender: 'Male',
    nationality: 'Qatari',
    dob: '2014-03-25',
    qId: '31463401492',
    email: 'B04743@amab.com.qa',
    studentClass: '03B',
    fatherPhone: '55333252',
    fatherEmail: '28663402266@taallumparents.com',
    fatherName: 'Abdulla Saeed A A Al-Marri'
  },
  {
      id: 'QAAMAB0001B02374',
      name: 'Sultan A.Aziz S B',
      gender: 'Male',
      nationality: 'Qatari',
      dob: '2008-12-03',
      qId: '30863406454',
      email: 'B02374@amab.com.qa',
      studentClass: '09B',
      fatherPhone: '55544459',
      fatherEmail: '28668200171@taallumparents.com'
  },
  {
    id: 'QAAMAB0001B03056',
    name: 'Hamad Nasser S A',
    gender: 'Male',
    nationality: 'Qatari',
    dob: '2011-04-18',
    qId: '31163401820',
    email: 'B03056@amab.com.qa',
    studentClass: '07B',
    fatherPhone: '30570777',
    fatherEmail: '28781800649@amab.com.qa',
    fatherName: 'Nasser Sahrab A H Mohammed'
  }
];
