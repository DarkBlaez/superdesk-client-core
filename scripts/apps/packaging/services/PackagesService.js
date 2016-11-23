PackagesService.$inject = ['api', '$q', 'archiveService', 'lock', 'autosave', 'authoring',
    'authoringWorkspace', 'desks', '$rootScope'];
export function PackagesService(api, $q, archiveService, lock, autosave, authoring,
    authoringWorkspace, desks, $rootScope) {
    var self = this;

    this.groupList = ['main', 'story', 'sidebars', 'fact box'];
    this.packageGroupItems = {};

    this.fetch = function fetch(_id) {
        return api.find('archive', _id).then(function(result) {
            return result;
        });
    };

    this.open = function open(_id, readOnly) {
        return authoring.open(_id, readOnly);
    };

    this.createPackageFromItems = function(items, defaults) {
        var idRef = 'main';
        var item = items[0];
        var newPackage = {
            headline: item.headline || item.description_text || '',
            slugline: item.slugline || '',
            description_text: item.description_text || '',
            state: 'draft',
            type: 'composite',
            version: 0
        };
        var groups = [{
            role: 'grpRole:NEP',
            refs: [{idRef: idRef}],
            id: 'root'
        },
            getGroupFor(null, idRef)
        ];
        newPackage = setDefaults(newPackage, defaults);
        newPackage.groups = groups;
        if (!newPackage.task || !newPackage.task.desk) {
            newPackage.task = {desk: desks.getCurrentDeskId()};
        }
        this.addItemsToPackage(newPackage, idRef, items);
        return api.save('archive', newPackage);
    };

    this.createEmptyPackage = function(defaults, idRef) {
        idRef = idRef || 'main';
        var newPackage = {
            headline: '',
            slugline: '',
            description_text: '',
            type: 'composite',
            version: 0,
            groups: [
                {
                    role: 'grpRole:NEP',
                    refs: [{idRef: idRef}],
                    id: 'root'
                },
                getGroupFor(null, idRef)
            ]
        };
        newPackage = setDefaults(newPackage, defaults);

        if (!newPackage.task || !newPackage.task.desk) {
            newPackage.task = {desk: desks.getCurrentDeskId()};
        }

        return api.save('archive', newPackage);

    };

    this.addItemsToPackage = function(current, groupId, items) {
        var origGroups = _.cloneDeep(current.groups);

        var targetGroup = _.find(origGroups, function(group) {
            return group.id.toLowerCase() === groupId;
        });

        if (!targetGroup) {
            var rootGroup = _.find(origGroups, {id: 'root'});
            rootGroup.refs.push({idRef: groupId});
            targetGroup = {
                id: groupId,
                refs: [],
                role: 'grpRole:' + groupId
            };
            origGroups.push(targetGroup);
        }
        _.each(items, function(item) {
            targetGroup.refs.push(self.getReferenceFor(item));
        });
        _.extend(current, {groups: origGroups});
    };

    this.isAdded = function(pkg, item) {
        var added = pkg.groups ? pkg.groups.some(function(group) {
            return group.refs.some(function(ref) {
                return (ref.guid === item._id) || (ref.residRef === item._id);
            });
        }) : false;
        var addedToPkg = this.isAddedToPackage(pkg, item);
        return added || addedToPkg;
    };

    this.fetchItem = function(packageItem) {
        var repo = packageItem.location || 'ingest';
        return api(repo).getById(packageItem.residRef)
            .then(function(item) {
                return item;
            }, function(response) {
                if (response.status === 404) {
                    console.log('Item not found');
                }
            });
    };

    this.getReferenceFor = function(item) {
        return {
            type: item.type || '',
            headline: item.headline || '',
            residRef: item._id,
            location: 'archive',
            slugline: item.slugline || '',
            renditions: item.renditions || {},
            itemClass: item.type ? ('icls:' + item.type) : ''
        };
    };

    this.addPackageGroupItem = function(group, item, broadcast) {
        broadcast = (typeof broadcast === 'undefined');
        var pkg = authoringWorkspace.getItem();
        var pkgId = pkg._id;
        if (typeof this.packageGroupItems[pkgId] === 'undefined') {
            this.packageGroupItems[pkgId] = [];
        }
        if (_.indexOf(this.packageGroupItems[pkgId], item._id) === -1) {
            this.packageGroupItems[pkgId].unshift(item._id);
        }
        if (broadcast) {
            $rootScope.$broadcast('package:addItems', {items: [item], group: group});
        }
    };

    this.removePackageGroupItem = function(group, item) {
        var pkg = authoringWorkspace.getItem();
        _.remove(this.packageGroupItems[pkg._id], item._id);
    };

    this.isAddedToPackage = function(pkg, item) {
        return pkg ? (_.indexOf(this.packageGroupItems[pkg._id], item._id) !== -1) : false;
    };

    function getGroupFor(item, idRef) {
        var refs = [];
        if (item) {
            refs.push({
                headline: item.headline || '',
                residRef: item._id,
                location: 'archive',
                slugline: item.slugline || '',
                renditions: item.renditions || {}
            });
        }
        return {
            refs: refs,
            id: idRef,
            role: 'grpRole:' + idRef
        };
    }

    function setDefaults(item, defaults) {
        if (angular.isUndefined(defaults) || !_.isObject(defaults)) {
            defaults = {};
        }

        archiveService.addTaskToArticle(defaults);
        return _.merge(item, defaults);
    }

}
