-- Migration script to add image fields to VisitorPuposeMaster table
-- This adds support for purpose icons/images

-- Add image-related columns to VisitorPuposeMaster
ALTER TABLE VisitorPuposeMaster 
ADD COLUMN IF NOT EXISTS ImageFlag char(1) DEFAULT 'N',
ADD COLUMN IF NOT EXISTS ImagePath varchar(750),
ADD COLUMN IF NOT EXISTS ImageName varchar(250),
ADD COLUMN IF NOT EXISTS ImageUrl varchar(750);

-- Add comments to explain the new columns
COMMENT ON COLUMN VisitorPuposeMaster.ImageFlag IS 'Y if purpose has an image, N otherwise';
COMMENT ON COLUMN VisitorPuposeMaster.ImagePath IS 'Relative path to the purpose image file';
COMMENT ON COLUMN VisitorPuposeMaster.ImageName IS 'Original filename of the purpose image';
COMMENT ON COLUMN VisitorPuposeMaster.ImageUrl IS 'Full URL to access the purpose image';

-- Create index for better performance on image queries
CREATE INDEX IF NOT EXISTS idx_visitor_purpose_image_flag ON VisitorPuposeMaster(ImageFlag) WHERE ImageFlag = 'Y';