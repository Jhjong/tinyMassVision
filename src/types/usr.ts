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

export interface UsrLogin extends User{
  password: string,
}

export interface UsrProfile extends User{
  identity: string,
}
