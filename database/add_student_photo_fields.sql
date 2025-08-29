-- Add student photo fields to StudentDayBoardingList table
ALTER TABLE StudentDayBoardingList 
ADD COLUMN StudentPhotoFlag CHAR(1) DEFAULT 'N',
ADD COLUMN StudentPhotoPath VARCHAR(750),
ADD COLUMN StudentPhotoName VARCHAR(250);

-- Add comment for clarity
COMMENT ON COLUMN StudentDayBoardingList.StudentPhotoFlag IS 'Y if student has photo, N if no photo';
COMMENT ON COLUMN StudentDayBoardingList.StudentPhotoPath IS 'Path to student photo file';
COMMENT ON COLUMN StudentDayBoardingList.StudentPhotoName IS 'Student photo file name';