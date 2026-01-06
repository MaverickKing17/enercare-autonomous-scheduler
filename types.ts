
export enum Persona {
  ANGELA = 'Angela',
  MIKE = 'Mike'
}

export interface CustomerData {
  name: string;
  phone: string;
  address: string;
  heatingType: string;
  unitAge: string;
  problemSummary: string;
  isHotInstall: boolean;
  activeAgent: string;
}

export interface TranscriptionEntry {
  role: 'user' | 'model';
  text: string;
  persona?: Persona;
}
