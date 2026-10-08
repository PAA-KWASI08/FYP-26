export const mockStudent = {
  studentId: "22259801",
  fullName: "Student 1",
  programme: "Computer Science",
  department: "Computer Science",
  level: "L400",
  college: "College of Basic and Applied Sciences",
};

export function getStudentInitials(fullName) {
  return fullName
    .split(/\s+/)
    .map((part) => part.match(/[A-Za-z]/)?.[0] ?? "")
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
