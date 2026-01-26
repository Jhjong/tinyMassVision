export interface User{
  username: string,
  email: string,
}
export interface UsrSignup extends User{
  password: string,
  identity: null,
  active: true, //default must be True
  verify_code: string,
}

export interface UsrLogin {
  username: string;
  password: string;
  // 登录不需要email字段
}

export interface UsrProfile extends User{
  identity: string,
}
