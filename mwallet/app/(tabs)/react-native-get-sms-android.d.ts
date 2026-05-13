declare module 'react-native-get-sms-android' {
  export default class SmsAndroid {
    static list(
      filter: string,
      fail: (error: any) => void,
      success: (count: number, smsList: string) => void
    ): void;
  }
}