export type StaticCoordinator = {
  name: string;
  role: string;
  department: string | null;
  type: "STUDENT" | "FACULTY";
  image: string | null;
  email: string | null;
  phone: string | null;
  isLead?: boolean;
};

export const COORDINATORS: StaticCoordinator[] = [
  {
    name: "Manasa M Swamy",
    role: "Vice President",
    department: "CSE",
    type: "STUDENT",
    image: "/images/coordinators/manasa-m-swamy.jpg",
    email: "manasauttam@gmail.com",
    phone: "7760882899",
    isLead: true,
  },
  {
    name: "Rakshitha K M",
    role: "Secretary",
    department: "CSE",
    type: "STUDENT",
    image: "/images/coordinators/rakshitha-k-m.jpg",
    email: "rakshithakm1602@gmail.com",
    phone: "9845058451",
  },
  {
    name: "Madan Gowda B U",
    role: "Secretary",
    department: "CSE",
    type: "STUDENT",
    image: "/images/coordinators/madan-gowda-b-u.jpg",
    email: "madangowdabu2005@gmail.com",
    phone: "7676453140",
  },
  {
    name: "Bindu B S",
    role: "Joint Secretary",
    department: "CSE",
    type: "STUDENT",
    image: "/images/coordinators/bindu-b-s.jpg",
    email: "bindu.bs807@gmail.com",
    phone: "8073709238",
  },
  {
    name: "Arjun Urs R",
    role: "Joint Secretary",
    department: "CSE",
    type: "STUDENT",
    image: "/images/coordinators/arjun-urs-r.jpg",
    email: "arjunursr2005@gmail.com",
    phone: "7483522779",
  },
  {
    name: "Divya H",
    role: "Joint Secretary",
    department: "AI&ML",
    type: "STUDENT",
    image: "/images/coordinators/divya-h.jpg",
    email: "divyahgowda0901@gmail.com",
    phone: "7019231891",
  },
  {
    name: "Srinidhi TG",
    role: "Joint Secretary",
    department: "AI&ML",
    type: "STUDENT",
    image: "/images/coordinators/srinidhi-tg.jpg",
    email: "srinidhitg2006@gmail.com",
    phone: "8660586517",
  },
  {
    name: "Kishore P",
    role: "Vice President",
    department: null,
    type: "STUDENT",
    image: "/images/coordinators/kishore-p.jpg",
    email: "kishkeerthi274@gmail.com",
    phone: "7348928249",
  },

  {
    name: "Dr. Mahadev Prasad",
    role: "Faculty Coordinator",
    department: null,
    type: "FACULTY",
    image: null,
    email: null,
    phone: null,
  },
  {
    name: "Prof. Karthik",
    role: "Faculty Coordinator",
    department: null,
    type: "FACULTY",
    image: null,
    email: null,
    phone: null,
  },
  {
    name: "Dr. Malathi",
    role: "Faculty Coordinator",
    department: null,
    type: "FACULTY",
    image: null,
    email: null,
    phone: null,
  },
  {
    name: "Prof. Sreenidhi",
    role: "Faculty Coordinator",
    department: null,
    type: "FACULTY",
    image: null,
    email: null,
    phone: null,
  },
];
