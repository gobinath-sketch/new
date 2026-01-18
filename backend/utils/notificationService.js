/**
 * Notification Service
 * Creates notifications for various events and assigns them to relevant roles
 */

export const createNotification = async (type, entityType, entityId, createdBy, metadata = {}) => {
  try {
    const Notification = (await import('../models/Notification.js')).default;
    const User = (await import('../models/User.js')).default;

    // Get creator info
    const creator = await User.findById(createdBy).select('name role');
    if (!creator) return;

    // Determine which roles should receive notifications
    const targetRoles = getTargetRoles(type, creator.role);

    // Create notification message
    const { title, message } = getNotificationContent(type, entityType, creator.name, metadata);

    // Create notifications for all target roles (excluding creator)
    const notifications = [];
    for (const role of targetRoles) {
      const users = await User.find({ role }).select('_id');
      
      for (const user of users) {
        // Don't notify the creator
        if (user._id.toString() === createdBy.toString()) {
          continue;
        }
        
        const notification = new Notification({
          userId: user._id,
          role: role,
          type,
          title,
          message,
          entityType,
          entityId,
          createdBy: creator._id,
          createdByName: creator.name,
          metadata
        });
        
        notifications.push(notification);
      }
    }

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Determine which roles should receive notifications based on event type and creator role
const getTargetRoles = (type, creatorRole) => {
  const allRoles = ['Sales Executive', 'Sales Manager', 'Business Head', 'Director', 'Operations Manager', 'Finance Manager'];
  
  switch (type) {
    case 'opportunity_created':
      if (creatorRole === 'Sales Executive') {
        return ['Sales Manager', 'Operations Manager', 'Finance Manager', 'Business Head'];
      } else if (creatorRole === 'Sales Manager') {
        return ['Sales Executive', 'Operations Manager', 'Finance Manager', 'Business Head'];
      }
      break;
    
    case 'program_created':
      return ['Operations Manager', 'Business Head', 'Director', 'Finance Manager'];
    
    case 'opportunity_qualified':
      return ['Operations Manager', 'Business Head', 'Finance Manager'];
    
    case 'opportunity_sent_to_delivery':
      return ['Operations Manager', 'Business Head', 'Finance Manager'];
    
    case 'opportunity_converted':
      return ['Business Head', 'Director', 'Finance Manager'];
    
    case 'opportunity_lost':
      return ['Business Head', 'Director'];
    
    default:
      return allRoles;
  }
  
  return [];
};

// Generate notification title and message
const getNotificationContent = (type, entityType, creatorName, metadata) => {
  switch (type) {
    case 'opportunity_created':
      return {
        title: 'New Opportunity Created',
        message: `${creatorName} created a new ${entityType.toLowerCase()}${metadata.adhocId ? ` (${metadata.adhocId})` : ''}`
      };
    
    case 'program_created':
      return {
        title: 'New Program Created',
        message: `${creatorName} created a new program${metadata.programName ? ` (${metadata.programName})` : ''}`
      };
    
    case 'opportunity_qualified':
      return {
        title: 'Opportunity Qualified',
        message: `${creatorName} qualified an opportunity${metadata.adhocId ? ` (${metadata.adhocId})` : ''}`
      };
    
    case 'opportunity_sent_to_delivery':
      return {
        title: 'Opportunity Sent to Delivery',
        message: `${creatorName} sent an opportunity to delivery${metadata.adhocId ? ` (${metadata.adhocId})` : ''}`
      };
    
    case 'opportunity_converted':
      return {
        title: 'Opportunity Converted',
        message: `${creatorName} converted an opportunity to deal${metadata.adhocId ? ` (${metadata.adhocId})` : ''}`
      };
    
    case 'opportunity_lost':
      return {
        title: 'Opportunity Lost',
        message: `${creatorName} marked an opportunity as lost${metadata.adhocId ? ` (${metadata.adhocId})` : ''}`
      };
    
    default:
      return {
        title: 'New Notification',
        message: `${creatorName} performed an action`
      };
  }
};
